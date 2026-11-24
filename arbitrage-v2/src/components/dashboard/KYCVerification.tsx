import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Clock, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DOCUMENT_TYPES = [
  { value: 'id_card', label: "Carte nationale d'identité" },
  { value: 'passport', label: 'Passeport' },
  { value: 'driver_license', label: 'Permis de conduire' },
];

async function uploadKycFile(profileId: string, file: File, label: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${profileId}/${label}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('kyc-documents').upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

/**
 * Gate shown only in the withdrawal flow. Renders:
 * - nothing (returns null) once KYC is approved, so the parent can show the withdrawal form
 * - a status banner while pending / rejected
 * - a submission form otherwise
 */
export function KYCVerification({ onApproved }: { onApproved?: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState((profile as any)?.kyc_full_name || (profile as any)?.full_name || '');
  const [docType, setDocType] = useState((profile as any)?.kyc_document_type || 'id_card');
  const [docNumber, setDocNumber] = useState((profile as any)?.kyc_document_number || '');
  const [country, setCountry] = useState((profile as any)?.kyc_country || '');
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const status: string = (profile as any)?.kyc_status || 'not_submitted';

  if (status === 'approved') {
    onApproved?.();
    return null;
  }

  const submit = async () => {
    if (!profile) return;
    if (!fullName.trim() || !docNumber.trim() || !country.trim() || !front || !selfie) {
      toast({ title: 'Formulaire incomplet', description: 'Nom, numéro de document, pays, photo du document (recto) et selfie sont requis.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const frontUrl = await uploadKycFile(profile.id, front, 'front');
      const backUrl = back ? await uploadKycFile(profile.id, back, 'back') : (profile as any)?.kyc_document_back_url || null;
      const selfieUrl = await uploadKycFile(profile.id, selfie, 'selfie');

      const { error } = await supabase
        .from('profiles')
        .update({
          kyc_full_name: fullName.trim(),
          kyc_document_type: docType,
          kyc_document_number: docNumber.trim(),
          kyc_country: country.trim(),
          kyc_document_front_url: frontUrl,
          kyc_document_back_url: backUrl,
          kyc_selfie_url: selfieUrl,
        })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Vérification envoyée', description: 'Votre dossier KYC est en cours de revue (24-48h).' });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  if (status === 'pending') {
    return (
      <div className="glass-card p-5 space-y-2 text-center">
        <Clock className="w-8 h-8 mx-auto text-warning" />
        <h3 className="font-bold">Vérification KYC en cours</h3>
        <p className="text-sm text-muted-foreground">
          Votre dossier a été soumis et est en cours de revue par notre équipe (24-48h). Les retraits seront débloqués une fois votre identité vérifiée.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        {status === 'rejected' ? <ShieldX className="w-5 h-5 text-destructive" /> : <ShieldAlert className="w-5 h-5 text-warning" />}
        <h3 className="font-bold">Vérification d'identité (KYC) requise</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Pour la sécurité de votre compte, une vérification d'identité est nécessaire avant votre premier retrait.
      </p>
      {status === 'rejected' && (profile as any)?.kyc_rejection_reason && (
        <div className="p-3 rounded bg-destructive/10 border border-destructive/30 text-destructive text-xs">
          Dossier précédent refusé : {(profile as any).kyc_rejection_reason}. Merci de resoumettre vos documents.
        </div>
      )}

      <input placeholder="Nom complet (comme sur le document)" value={fullName} onChange={(e) => setFullName(e.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />

      <Select value={docType} onValueChange={setDocType}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {DOCUMENT_TYPES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <input placeholder="Numéro du document" value={docNumber} onChange={(e) => setDocNumber(e.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />

      <input placeholder="Pays de résidence" value={country} onChange={(e) => setCountry(e.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-input border border-border input-premium" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FileField label="Document (recto)" file={front} onChange={setFront} required />
        <FileField label="Document (verso)" file={back} onChange={setBack} />
        <FileField label="Selfie avec le document" file={selfie} onChange={setSelfie} required />
      </div>

      <Button className="w-full btn-gold" onClick={submit} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
        {loading ? 'Envoi...' : 'Soumettre pour vérification'}
      </Button>
      <p className="text-[11px] text-center text-muted-foreground">Vos documents sont stockés de façon sécurisée et ne sont visibles que par notre équipe de conformité.</p>
    </div>
  );
}

function FileField({ label, file, onChange, required }: { label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean }) {
  return (
    <label className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border border-dashed border-border bg-secondary/20 cursor-pointer text-center hover:border-primary/50 transition-colors">
      <Upload className="w-4 h-4 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground">{label}{required ? ' *' : ''}</span>
      {file && <span className="text-[10px] text-success truncate max-w-full">{file.name}</span>}
      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => onChange(e.target.files?.[0] || null)} />
    </label>
  );
}
