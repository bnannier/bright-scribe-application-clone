import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      google_access_token, 
      file_data, 
      file_name, 
      file_type, 
      folder_id,
      mime_type = 'application/octet-stream'
    } = await req.json();

    if (!google_access_token || !file_data || !file_name || !folder_id) {
      throw new Error('Missing required parameters');
    }

    // Validate inputs
    if (typeof google_access_token !== 'string' || google_access_token.length < 10) {
      throw new Error('Invalid access token format');
    }
    
    if (typeof file_name !== 'string' || file_name.length > 255) {
      throw new Error('Invalid file name');
    }
    
    if (typeof folder_id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(folder_id)) {
      throw new Error('Invalid folder ID');
    }

    console.log('📤 Uploading file to Google Drive:', file_name);

    // Convert base64 data to bytes if needed
    let fileContent;
    if (typeof file_data === 'string') {
      // Remove data URL prefix if present
      const base64Data = file_data.includes(',') ? file_data.split(',')[1] : file_data;
      fileContent = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } else {
      fileContent = new Uint8Array(file_data);
    }

    // Create multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = {
      name: file_name,
      parents: [folder_id],
      ...(mime_type && { mimeType: mime_type })
    };

    let multipartRequestBody = delimiter;
    multipartRequestBody += 'Content-Type: application/json\r\n\r\n';
    multipartRequestBody += JSON.stringify(metadata) + delimiter;
    multipartRequestBody += `Content-Type: ${mime_type}\r\n\r\n`;

    // Convert to Uint8Array for binary data
    const encoder = new TextEncoder();
    const bodyStart = encoder.encode(multipartRequestBody);
    const bodyEnd = encoder.encode(close_delim);

    const body = new Uint8Array(bodyStart.length + fileContent.length + bodyEnd.length);
    body.set(bodyStart);
    body.set(fileContent, bodyStart.length);
    body.set(bodyEnd, bodyStart.length + fileContent.length);

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${google_access_token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: body,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ File uploaded successfully:', uploadResult.id);

    return new Response(JSON.stringify({ 
      success: true, 
      file_id: uploadResult.id,
      file_name: uploadResult.name,
      file_size: uploadResult.size,
      web_view_link: uploadResult.webViewLink
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error uploading file to Google Drive:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});