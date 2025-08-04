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

    const { google_access_token } = await req.json();

    if (!google_access_token) {
      throw new Error('Google access token is required');
    }

    // Validate token format (should be a Bearer token)
    if (typeof google_access_token !== 'string' || google_access_token.length < 10) {
      throw new Error('Invalid access token format');
    }

    console.log('🚀 Initializing BrightScribe folder structure for user:', user.id);

    // Create the main BrightScribe folder
    const createFolder = async (name: string, parentId?: string) => {
      const metadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId && { parents: [parentId] })
      };

      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${google_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error(`Failed to create folder ${name}: ${response.statusText}`);
      }

      return await response.json();
    };

    // Check if BrightScribe folder already exists
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='BrightScribe' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          'Authorization': `Bearer ${google_access_token}`,
        },
      }
    );

    const searchData = await searchResponse.json();
    
    let brightScribeFolder;
    if (searchData.files && searchData.files.length > 0) {
      brightScribeFolder = searchData.files[0];
      console.log('📁 BrightScribe folder already exists:', brightScribeFolder.id);
    } else {
      brightScribeFolder = await createFolder('BrightScribe');
      console.log('📁 Created BrightScribe folder:', brightScribeFolder.id);
    }

    // Create sub-folders
    const notebooks = await createFolder('Notebooks', brightScribeFolder.id);
    const attachments = await createFolder('Attachments', brightScribeFolder.id);
    const exports = await createFolder('Exports', brightScribeFolder.id);
    const trash = await createFolder('Trash', brightScribeFolder.id);

    // Create attachment sub-folders
    const images = await createFolder('Images', attachments.id);
    const documents = await createFolder('Documents', attachments.id);
    const voiceRecordings = await createFolder('Voice Recordings', attachments.id);

    // Create export sub-folders
    const googleDocs = await createFolder('Google Docs', exports.id);

    // Create default notebooks
    const personal = await createFolder('Personal', notebooks.id);
    const work = await createFolder('Work', notebooks.id);

    const folderStructure = {
      brightScribe: brightScribeFolder.id,
      notebooks: {
        main: notebooks.id,
        personal: personal.id,
        work: work.id,
      },
      attachments: {
        main: attachments.id,
        images: images.id,
        documents: documents.id,
        voiceRecordings: voiceRecordings.id,
      },
      exports: {
        main: exports.id,
        googleDocs: googleDocs.id,
      },
      trash: trash.id,
    };

    console.log('✅ BrightScribe folder structure created successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      folderStructure,
      message: 'BrightScribe folder structure initialized successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error initializing BrightScribe folders:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});