'use client'

import { useState } from 'react'
import { 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  AlertCircle, 
  Info, 
  X,
  Mail,
  Search,
  User,
  Settings,
  Download,
  Plus
} from 'lucide-react'
import { ThemeToggle, ThemeToggleWithLabel } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/ui/Modal'
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/Toast'

export default function StyleguidePage() {
  const [showModal, setShowModal] = useState(false)
  const [showToast, setShowToast] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-display-2 font-bold text-foreground">Styleguide</h1>
              <p className="text-body text-muted-foreground">Designsystem för Smart Offertgenerator</p>
            </div>
            <ThemeToggleWithLabel />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Theme Toggle Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Tema-växlare</CardTitle>
              <CardDescription>Växla mellan ljust, mörkt och systemtema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <ThemeToggleWithLabel />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>• Klicka för att växla mellan ljust, mörkt och systemtema</p>
                <p>• Systemtema följer datorns inställningar</p>
                <p>• Tema sparas i localStorage</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Typography Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Typografi</CardTitle>
              <CardDescription>Text-storlekar och hierarki</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h1 className="text-display-1 font-bold">Display 1 - 3.5rem</h1>
                <h2 className="text-display-2 font-bold">Display 2 - 3rem</h2>
                <h3 className="text-display-3 font-bold">Display 3 - 2.5rem</h3>
              </div>
              <div>
                <h1 className="text-h1 font-bold">H1 - 2.25rem</h1>
                <h2 className="text-h2 font-bold">H2 - 1.875rem</h2>
                <h3 className="text-h3 font-bold">H3 - 1.5rem</h3>
                <h4 className="text-h4 font-bold">H4 - 1.25rem</h4>
                <h5 className="text-h5 font-bold">H5 - 1.125rem</h5>
                <h6 className="text-h6 font-bold">H6 - 1rem</h6>
              </div>
              <div>
                <p className="text-body-lg">Body Large - 1.125rem</p>
                <p className="text-body">Body - 1rem</p>
                <p className="text-body-sm">Body Small - 0.875rem</p>
                <p className="text-small">Small - 0.75rem</p>
                <p className="text-xs">Extra Small - 0.625rem</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Colors Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Färger</CardTitle>
              <CardDescription>Design tokens för färger</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="brand" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="brand">Brand</TabsTrigger>
                  <TabsTrigger value="neutral">Neutral</TabsTrigger>
                  <TabsTrigger value="semantic">Semantic</TabsTrigger>
                  <TabsTrigger value="background">Background</TabsTrigger>
                  <TabsTrigger value="functional">Functional</TabsTrigger>
                </TabsList>
                
                <TabsContent value="brand" className="space-y-4">
                  <div className="grid grid-cols-5 gap-4">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                      <div key={shade} className="space-y-2">
                        <div 
                          className={`h-16 w-full rounded-md border bg-brand-${shade}`}
                          title={`brand-${shade}`}
                        />
                        <p className="text-xs text-center">brand-{shade}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="neutral" className="space-y-4">
                  <div className="grid grid-cols-5 gap-4">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                      <div key={shade} className="space-y-2">
                        <div 
                          className={`h-16 w-full rounded-md border bg-neutral-${shade}`}
                          title={`neutral-${shade}`}
                        />
                        <p className="text-xs text-center">neutral-{shade}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="semantic" className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {['success', 'warn', 'error'].map((color) => (
                      <div key={color} className="space-y-2">
                        <div 
                          className={`h-16 w-full rounded-md border bg-${color}-500`}
                          title={`${color}-500`}
                        />
                        <p className="text-xs text-center">{color}-500</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="background" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-16 w-full rounded-md border bg-background" />
                      <p className="text-xs text-center">background</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 w-full rounded-md border bg-card" />
                      <p className="text-xs text-center">card</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="functional" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-16 w-full rounded-md border bg-primary" />
                      <p className="text-xs text-center">primary</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-16 w-full rounded-md border bg-secondary" />
                      <p className="text-xs text-center">secondary</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Buttons Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Knappar</CardTitle>
              <CardDescription>Olika varianter och storlekar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Variants */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Varianter</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="brand">Brand</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="warn">Warn</Button>
                  <Button variant="error">Error</Button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Storlekar</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </div>
              </div>

              {/* Icon buttons */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Ikon-knappar</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="icon-sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button size="icon-lg" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* States */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Tillstånd</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button disabled>Disabled</Button>
                  <Button loading>Loading</Button>
                  <Button leftIcon={<Mail className="h-4 w-4" />}>
                    Med vänster ikon
                  </Button>
                  <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Med höger ikon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Kort</CardTitle>
              <CardDescription>Kort-komponenter med olika innehåll</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enkelt kort</CardTitle>
                  <CardDescription>Ett kort med bara titel och beskrivning</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kort med innehåll</CardTitle>
                  <CardDescription>Ett kort med innehåll och footer</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Detta är innehållet i kortet. Här kan du lägga till text, bilder eller andra komponenter.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Åtgärd</Button>
                </CardFooter>
              </Card>
            </CardContent>
          </Card>
        </section>

        {/* Form Elements Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Formulärelement</CardTitle>
              <CardDescription>Input, Select och andra formulärkomponenter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Inputs */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Input-fält</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Enkel input" />
                  <Input 
                    label="Input med label"
                    placeholder="Med beskrivning"
                    helperText="Detta är hjälptext"
                  />
                  <Input 
                    leftIcon={<Mail className="h-4 w-4" />}
                    placeholder="Med vänster ikon"
                  />
                  <Input 
                    rightIcon={<Search className="h-4 w-4" />}
                    placeholder="Med höger ikon"
                  />
                  <Input 
                    error={true}
                    errorText="Detta är ett felmeddelande"
                    placeholder="Input med fel"
                  />
                </div>
              </div>

              {/* Selects */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Select-fält</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj ett alternativ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Alternativ 1</SelectItem>
                      <SelectItem value="option2">Alternativ 2</SelectItem>
                      <SelectItem value="option3">Alternativ 3</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="development">Utveckling</SelectItem>
                      <SelectItem value="marketing">Marknadsföring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Badge-komponenter med olika varianter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Variants */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Varianter</h3>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="brand">Brand</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warn">Warn</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Storlekar</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Badge size="sm">Small</Badge>
                  <Badge size="default">Default</Badge>
                  <Badge size="lg">Large</Badge>
                  <Badge size="xl">Extra Large</Badge>
                </div>
              </div>

              {/* With icons */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Med ikoner</h3>
                <div className="flex flex-wrap gap-4">
                  <Badge leftIcon={<Check className="h-3 w-3" />}>
                    Bekräftad
                  </Badge>
                  <Badge rightIcon={<AlertCircle className="h-3 w-3" />}>
                    Varning
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tables Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Tabeller</CardTitle>
              <CardDescription>Table-komponenter med olika innehåll</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>En lista över användare</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Anna Andersson</TableCell>
                    <TableCell>anna@example.com</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>
                      <Badge variant="success">Aktiv</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Erik Eriksson</TableCell>
                    <TableCell>erik@example.com</TableCell>
                    <TableCell>Användare</TableCell>
                    <TableCell>
                      <Badge variant="neutral">Inaktiv</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Maria Nilsson</TableCell>
                    <TableCell>maria@example.com</TableCell>
                    <TableCell>Editor</TableCell>
                    <TableCell>
                      <Badge variant="success">Aktiv</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Modal Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Modal</CardTitle>
              <CardDescription>Modal-komponenter för dialoger</CardDescription>
            </CardHeader>
            <CardContent>
              <Modal open={showModal} onOpenChange={setShowModal}>
                <ModalTrigger asChild>
                  <Button>Öppna Modal</Button>
                </ModalTrigger>
                <ModalContent>
                  <ModalHeader>
                    <ModalTitle>Exempel Modal</ModalTitle>
                    <ModalDescription>
                      Detta är en exempel-modal som visar hur komponenten fungerar.
                    </ModalDescription>
                  </ModalHeader>
                  <div className="py-4">
                    <p>Här kan du lägga till innehåll för din modal. Det kan vara formulär, text, bilder eller andra komponenter.</p>
                  </div>
                  <ModalFooter>
                    <Button variant="outline" onClick={() => setShowModal(false)}>
                      Avbryt
                    </Button>
                    <Button onClick={() => setShowModal(false)}>
                      Bekräfta
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </CardContent>
          </Card>
        </section>

        {/* Toast Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Toast-meddelanden</CardTitle>
              <CardDescription>Toast-komponenter för notifikationer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => setShowToast(true)} variant="default">
                  Visa Default Toast
                </Button>
                <Button onClick={() => setShowToast(true)} variant="success">
                  Visa Success Toast
                </Button>
                <Button onClick={() => setShowToast(true)} variant="warn">
                  Visa Warn Toast
                </Button>
                <Button onClick={() => setShowToast(true)} variant="error">
                  Visa Error Toast
                </Button>
              </div>

              {showToast && (
                <ToastProvider>
                  <Toast variant="default" className="w-full">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <div>
                        <ToastTitle>Toast-meddelande</ToastTitle>
                        <ToastDescription>
                          Detta är ett exempel på en toast-notifikation.
                        </ToastDescription>
                      </div>
                    </div>
                    <ToastClose />
                    <ToastAction altText="Gå till inställningar">
                      Gå till inställningar
                    </ToastAction>
                  </Toast>
                  <ToastViewport />
                </ToastProvider>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Spacing & Shadows Section */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Spacing & Skuggor</CardTitle>
              <CardDescription>Design tokens för spacing och skuggor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Spacing */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Spacing</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-brand-500 rounded"></div>
                    <span className="text-sm">4px (1rem)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-brand-500 rounded"></div>
                    <span className="text-sm">32px (2rem)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-500 rounded"></div>
                    <span className="text-sm">48px (3rem)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-500 rounded"></div>
                    <span className="text-sm">64px (4rem)</span>
                  </div>
                </div>
              </div>

              {/* Shadows */}
              <div>
                <h3 className="text-h5 font-semibold mb-4">Skuggor</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-background border rounded-md shadow-xs">
                    <p className="text-xs text-center">shadow-xs</p>
                  </div>
                  <div className="p-4 bg-background border rounded-md shadow-sm">
                    <p className="text-xs text-center">shadow-sm</p>
                  </div>
                  <div className="p-4 bg-background border rounded-md shadow-md">
                    <p className="text-xs text-center">shadow-md</p>
                  </div>
                  <div className="p-4 bg-background border rounded-md shadow-lg">
                    <p className="text-xs text-center">shadow-lg</p>
                  </div>
                  <div className="p-4 bg-background border rounded-md shadow-xl">
                    <p className="text-xs text-center">shadow-xl</p>
                  </div>
                  <div className="p-4 bg-background border rounded-md shadow-2xl">
                    <p className="text-xs text-center">shadow-2xl</p>
                  </div>
                  <div className="p-4 bg-background border rounded-md shadow-brand">
                    <p className="text-xs text-center">shadow-brand</p>
                  </div>
                  <div className="p-4 bg-background border rounded-md shadow-inner">
                    <p className="text-xs text-center">shadow-inner</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

// Helper component for arrow icon
function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}
