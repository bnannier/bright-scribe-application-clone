import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Check, 
  Palette, 
  Type, 
  Box, 
  Layers, 
  Zap,
  Code2,
  Eye,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from '@/components/ui/use-toast';

const DesignSystem = () => {
  const { theme, setTheme } = useTheme();
  const [copiedText, setCopiedText] = useState<string>('');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast({
        description: `Copied ${label} to clipboard!`,
      });
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const ColorBox = ({ name, className, variable }: { name: string; className: string; variable: string }) => (
    <div className="space-y-2">
      <div className={`w-full h-20 rounded-lg border ${className}`} />
      <div className="space-y-1">
        <p className="text-sm font-medium">{name}</p>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => copyToClipboard(variable, name)}
        >
          {copiedText === name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span className="ml-1">{variable}</span>
        </Button>
      </div>
    </div>
  );

  const ComponentShowcase = ({ title, description, children, code }: {
    title: string;
    description: string;
    children: React.ReactNode;
    code?: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-6 border rounded-lg bg-muted/20">
          {children}
        </div>
        {code && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <Code2 className="w-4 h-4" />
              Show code
            </summary>
            <div className="mt-2 p-4 bg-muted rounded-lg">
              <pre className="text-sm overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BrightScribe Design System
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              A comprehensive collection of design tokens, components, and patterns
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        <Tabs defaultValue="colors" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Box className="w-4 h-4" />
              Components
            </TabsTrigger>
            <TabsTrigger value="effects" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Effects
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Layout
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Color Palette</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <ColorBox name="Primary" className="bg-primary" variable="hsl(var(--primary))" />
                  <ColorBox name="Secondary" className="bg-secondary" variable="hsl(var(--secondary))" />
                  <ColorBox name="Accent" className="bg-accent" variable="hsl(var(--accent))" />
                  <ColorBox name="Muted" className="bg-muted" variable="hsl(var(--muted))" />
                  <ColorBox name="Success" className="bg-success" variable="hsl(var(--success))" />
                  <ColorBox name="Warning" className="bg-warning" variable="hsl(var(--warning))" />
                  <ColorBox name="Destructive" className="bg-destructive" variable="hsl(var(--destructive))" />
                  <ColorBox name="Info" className="bg-info" variable="hsl(var(--info))" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Gradients</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="w-full h-20 rounded-lg border bg-gradient-primary" />
                    <p className="text-sm font-medium">Primary Gradient</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs text-muted-foreground"
                      onClick={() => copyToClipboard('bg-gradient-primary', 'Primary Gradient')}
                    >
                      {copiedText === 'Primary Gradient' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span className="ml-1">bg-gradient-primary</span>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-20 rounded-lg border bg-gradient-secondary" />
                    <p className="text-sm font-medium">Secondary Gradient</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs text-muted-foreground"
                      onClick={() => copyToClipboard('bg-gradient-secondary', 'Secondary Gradient')}
                    >
                      {copiedText === 'Secondary Gradient' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span className="ml-1">bg-gradient-secondary</span>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-20 rounded-lg border bg-gradient-hero" />
                    <p className="text-sm font-medium">Hero Gradient</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 text-xs text-muted-foreground"
                      onClick={() => copyToClipboard('bg-gradient-hero', 'Hero Gradient')}
                    >
                      {copiedText === 'Hero Gradient' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span className="ml-1">bg-gradient-hero</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Typography Scale</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-6xl font-bold">Heading 1</h1>
                    <code className="text-sm text-muted-foreground">text-6xl font-bold</code>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-bold">Heading 2</h2>
                    <code className="text-sm text-muted-foreground">text-4xl font-bold</code>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold">Heading 3</h3>
                    <code className="text-sm text-muted-foreground">text-2xl font-semibold</code>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-semibold">Heading 4</h4>
                    <code className="text-sm text-muted-foreground">text-xl font-semibold</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base">Body text - The quick brown fox jumps over the lazy dog</p>
                    <code className="text-sm text-muted-foreground">text-base</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Small text - Supporting information</p>
                    <code className="text-sm text-muted-foreground">text-sm text-muted-foreground</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Font Families</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-sans text-lg">Inter - System Sans Serif</p>
                    <code className="text-sm text-muted-foreground">font-sans</code>
                  </div>
                  <div className="space-y-2">
                    <p className="font-mono text-lg">JetBrains Mono - Monospace</p>
                    <code className="text-sm text-muted-foreground">font-mono</code>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            <div className="grid gap-8">
              <ComponentShowcase
                title="Buttons"
                description="Interactive elements for user actions"
                code={`<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>`}
              >
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </ComponentShowcase>

              <ComponentShowcase
                title="Cards"
                description="Flexible containers for content"
                code={`<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>Card content goes here</CardContent>
</Card>`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Simple Card</CardTitle>
                      <CardDescription>Basic card with title and description</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>This is the card content area where you can place any content.</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-glow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Enhanced Card
                      </CardTitle>
                      <CardDescription>Card with glow shadow effect</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>This card uses the glow shadow for emphasis.</p>
                    </CardContent>
                  </Card>
                </div>
              </ComponentShowcase>

              <ComponentShowcase
                title="Form Elements"
                description="Input components for data collection"
                code={`<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="Enter your password" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="notifications" />
                      <Label htmlFor="notifications">Email notifications</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>Progress Example</Label>
                      <Progress value={75} className="w-full" />
                    </div>
                  </div>
                </div>
              </ComponentShowcase>

              <ComponentShowcase
                title="Badges"
                description="Small status indicators and labels"
                code={`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>`}
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </ComponentShowcase>
            </div>
          </TabsContent>

          {/* Effects Tab */}
          <TabsContent value="effects" className="space-y-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Shadow System</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="shadow-soft">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Soft Shadow</h3>
                      <p className="text-sm text-muted-foreground">shadow-soft</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-medium">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Medium Shadow</h3>
                      <p className="text-sm text-muted-foreground">shadow-medium</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-large">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Large Shadow</h3>
                      <p className="text-sm text-muted-foreground">shadow-large</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-glow">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Glow Shadow</h3>
                      <p className="text-sm text-muted-foreground">shadow-glow</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Animations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="animate-fade-in">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Fade In</h3>
                      <p className="text-sm text-muted-foreground">animate-fade-in</p>
                    </CardContent>
                  </Card>
                  <Card className="animate-slide-up">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Slide Up</h3>
                      <p className="text-sm text-muted-foreground">animate-slide-up</p>
                    </CardContent>
                  </Card>
                  <Card className="animate-scale-in">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">Scale In</h3>
                      <p className="text-sm text-muted-foreground">animate-scale-in</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Spacing Scale</h2>
                <div className="space-y-4">
                  {[1, 2, 4, 6, 8, 12, 16, 20, 24].map(size => (
                    <div key={size} className="flex items-center gap-4">
                      <div 
                        className="bg-primary rounded"
                        style={{ width: `${size * 0.25}rem`, height: '1rem' }}
                      />
                      <code className="text-sm">space-{size} ({size * 0.25}rem)</code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Border Radius</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="rounded-sm">
                    <CardContent className="p-6">
                      <p className="font-semibold">Small</p>
                      <code className="text-sm text-muted-foreground">rounded-sm</code>
                    </CardContent>
                  </Card>
                  <Card className="rounded-md">
                    <CardContent className="p-6">
                      <p className="font-semibold">Medium</p>
                      <code className="text-sm text-muted-foreground">rounded-md</code>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg">
                    <CardContent className="p-6">
                      <p className="font-semibold">Large</p>
                      <code className="text-sm text-muted-foreground">rounded-lg</code>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DesignSystem;