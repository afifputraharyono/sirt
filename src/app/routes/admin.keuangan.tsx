import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export default function AdminKeuangan() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Keuangan"
        description="Kelola kas bulanan, jimpitan, dan pengeluaran"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Kas Bapak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              —
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Kas Ibu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              —
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Jimpitan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              —
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kas-bapak">
        <TabsList>
          <TabsTrigger value="kas-bapak">
            <Wallet className="mr-2 h-4 w-4" />
            Kas Bapak
          </TabsTrigger>
          <TabsTrigger value="kas-ibu">
            <Wallet className="mr-2 h-4 w-4" />
            Kas Ibu
          </TabsTrigger>
          <TabsTrigger value="jimpitan">Jimpitan</TabsTrigger>
          <TabsTrigger value="pengeluaran">Pengeluaran</TabsTrigger>
          <TabsTrigger value="iuran">Iuran Insidental</TabsTrigger>
        </TabsList>

        <TabsContent value="kas-bapak">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Tabel kas bulanan bapak-bapak akan ditampilkan di sini.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kas-ibu">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Tabel kas bulanan ibu-ibu akan ditampilkan di sini.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jimpitan">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Tabel jimpitan harian akan ditampilkan di sini.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pengeluaran">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Tabel pengeluaran kas akan ditampilkan di sini.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iuran">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Tabel iuran insidental akan ditampilkan di sini.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
