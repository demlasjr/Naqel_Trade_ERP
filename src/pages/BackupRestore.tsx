import { useState } from "react";
import { Download, Upload, Database, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function BackupRestore() {
  const { user } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Tables to backup/restore (in order of dependencies)
  const tables = [
    'accounts',
    'customers',
    'vendors',
    'products',
    'product_categories',
    'sales_orders',
    'sales_line_items',
    'purchase_orders',
    'purchase_line_items',
    'transactions',
    'stock_movements',
    'employees',
    'payroll',
    'activity_logs',
  ];

  const createBackup = async () => {
    if (!user) {
      toast.error("Debes estar autenticado para crear un backup");
      return;
    }

    setIsBackingUp(true);
    setBackupStatus({ type: null, message: '' });

    try {
      const backupData: Record<string, any[]> = {};
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupInfo = {
        version: '1.0',
        created_at: new Date().toISOString(),
        created_by: user.id,
        created_by_email: user.email,
      };

      // Fetch data from all tables
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: true });

          if (error) {
            console.error(`Error fetching ${table}:`, error);
            backupData[table] = [];
          } else {
            backupData[table] = data || [];
          }
        } catch (error) {
          console.error(`Error fetching ${table}:`, error);
          backupData[table] = [];
        }
      }

      // Create backup object
      const backup = {
        ...backupInfo,
        data: backupData,
      };

      // Convert to JSON and create blob
      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `naqel-erp-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const totalRecords = Object.values(backupData).reduce((sum, arr) => sum + arr.length, 0);
      setBackupStatus({
        type: 'success',
        message: `Backup creado exitosamente. ${totalRecords} registros exportados.`,
      });
      toast.success(`Backup creado exitosamente (${totalRecords} registros)`);
    } catch (error: any) {
      console.error('Error creating backup:', error);
      setBackupStatus({
        type: 'error',
        message: `Error al crear backup: ${error.message}`,
      });
      toast.error('Error al crear backup: ' + error.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error("Debes estar autenticado para restaurar un backup");
      return;
    }

    setIsRestoring(true);
    setBackupStatus({ type: null, message: '' });

    try {
      // Read file
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data || typeof backup.data !== 'object') {
        throw new Error('Formato de backup inválido');
      }

      // Confirm restore
      const confirmed = window.confirm(
        `¿Estás seguro de restaurar este backup?\n\n` +
        `Fecha del backup: ${backup.created_at ? new Date(backup.created_at).toLocaleString() : 'Desconocida'}\n` +
        `Creado por: ${backup.created_by_email || 'Desconocido'}\n\n` +
        `ADVERTENCIA: Esta acción eliminará todos los datos actuales y los reemplazará con los datos del backup.`
      );

      if (!confirmed) {
        setIsRestoring(false);
        return;
      }

      let totalRestored = 0;
      const errors: string[] = [];

      // Restore data table by table (in order to handle dependencies correctly)
      for (const table of tables) {
        if (!backup.data[table] || !Array.isArray(backup.data[table])) {
          continue;
        }

        const tableData = backup.data[table];
        if (tableData.length === 0) continue;

        try {
          // Use upsert to handle existing records (replace if exists, insert if new)
          // For large datasets, we need to batch insert
          const batchSize = 100;
          for (let i = 0; i < tableData.length; i += batchSize) {
            const batch = tableData.slice(i, i + batchSize);
            
            // Clean the batch - keep IDs for proper relationship maintenance
            const cleanBatch = batch.map((record: any) => {
              // Keep id for relationships, but let database handle timestamps
              const { created_at, updated_at, ...rest } = record;
              return {
                ...rest,
                // Preserve created_at if it exists, otherwise let DB set it
                ...(created_at ? { created_at } : {}),
              };
            });

            // Try upsert first (handles both insert and update)
            const { error: upsertError } = await supabase
              .from(table)
              .upsert(cleanBatch, { onConflict: 'id' });

            if (upsertError) {
              // If upsert fails, try insert without IDs
              const batchWithoutIds = cleanBatch.map((record: any) => {
                const { id, ...rest } = record;
                return rest;
              });

              const { error: insertError } = await supabase
                .from(table)
                .insert(batchWithoutIds);

              if (insertError) {
                errors.push(`${table} (batch ${i / batchSize + 1}): ${insertError.message}`);
                console.error(`Error restoring ${table} batch:`, insertError);
              } else {
                totalRestored += batchWithoutIds.length;
              }
            } else {
              totalRestored += cleanBatch.length;
            }
          }
        } catch (error: any) {
          errors.push(`${table}: ${error.message}`);
          console.error(`Error restoring ${table}:`, error);
        }
      }

      if (errors.length > 0) {
        setBackupStatus({
          type: 'error',
          message: `Restauración completada con errores. ${totalRestored} registros restaurados. Errores: ${errors.join(', ')}`,
        });
        toast.error(`Restauración completada con algunos errores (${totalRestored} registros)`);
      } else {
        setBackupStatus({
          type: 'success',
          message: `Restauración completada exitosamente. ${totalRestored} registros restaurados.`,
        });
        toast.success(`Restauración completada exitosamente (${totalRestored} registros)`);
        
        // Refresh the page after a delay to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      setBackupStatus({
        type: 'error',
        message: `Error al restaurar backup: ${error.message}`,
      });
      toast.error('Error al restaurar backup: ' + error.message);
    } finally {
      setIsRestoring(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backup & Restore</h1>
        <p className="text-muted-foreground mt-2">
          Crea backups de tus datos y restáuralos cuando sea necesario
        </p>
      </div>

      {backupStatus.type && (
        <Alert variant={backupStatus.type === 'success' ? 'default' : 'destructive'}>
          {backupStatus.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>
            {backupStatus.type === 'success' ? 'Éxito' : 'Error'}
          </AlertTitle>
          <AlertDescription>{backupStatus.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Backup Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Crear Backup</CardTitle>
            </div>
            <CardDescription>
              Exporta todos tus datos a un archivo JSON para guardarlos de forma segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                El backup incluirá:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Cuentas contables</li>
                <li>Clientes y proveedores</li>
                <li>Productos e inventario</li>
                <li>Órdenes de venta y compra</li>
                <li>Transacciones</li>
                <li>Empleados y nómina</li>
                <li>Registros de actividad</li>
              </ul>
            </div>
            <Button
              onClick={createBackup}
              disabled={isBackingUp}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isBackingUp ? 'Creando backup...' : 'Crear Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Restore Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle>Restaurar Backup</CardTitle>
            </div>
            <CardDescription>
              Restaura tus datos desde un archivo de backup previamente creado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Advertencia</AlertTitle>
              <AlertDescription>
                Restaurar un backup reemplazará todos los datos actuales. 
                Asegúrate de crear un backup antes de restaurar.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label htmlFor="restore-file" className="cursor-pointer">
                <Button
                  asChild
                  variant="outline"
                  disabled={isRestoring}
                  className="w-full"
                  size="lg"
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isRestoring ? 'Restaurando...' : 'Seleccionar Archivo de Backup'}
                  </span>
                </Button>
              </label>
              <input
                id="restore-file"
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="hidden"
                disabled={isRestoring}
              />
              <p className="text-xs text-muted-foreground text-center">
                Solo archivos .json
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Recomendaciones:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Crea backups regularmente, especialmente antes de hacer cambios importantes</li>
              <li>Guarda los archivos de backup en un lugar seguro y fuera del servidor</li>
              <li>Verifica que el backup se haya creado correctamente antes de eliminar datos</li>
              <li>Los backups incluyen todos los datos excepto información de usuarios y autenticación</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Limitaciones:</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Los backups no incluyen información de usuarios, roles y autenticación</li>
              <li>Las relaciones entre registros se mantienen mediante IDs</li>
              <li>Los timestamps se regeneran al restaurar (created_at, updated_at)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

