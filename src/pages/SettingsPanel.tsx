import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { Settings } from "../types";

type SettingsPanelProps = {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onResetDemo: () => void;
  onClearLocal: () => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
};

export function SettingsPanel({ settings, onSettingsChange, onResetDemo, onClearLocal, onExport, onImport }: SettingsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");

  async function handleImport(file?: File) {
    if (!file) return;
    try {
      setImportError("");
      await onImport(file);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Não foi possível importar o arquivo.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Configurações</h2>
            <p>Controle como o total considerado deve ser calculado.</p>
          </div>
        </div>
        <label className="switch-row">
          <span>
            <strong>Contar séries indiretas</strong>
            <small>{settings.countIndirectSets ? "Total considera diretas + indiretas." : "Total considera apenas diretas."}</small>
          </span>
          <input
            checked={settings.countIndirectSets}
            onChange={(event) => onSettingsChange({ ...settings, countIndirectSets: event.target.checked, indirectSetMultiplier: 0.5 })}
            type="checkbox"
          />
        </label>
        <div className="readonly-setting">
          <strong>Multiplicador indireto</strong>
          <span>0.5 fixo nesta versão</span>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Dados locais</h2>
            <p>Os dados ficam somente neste navegador via localStorage.</p>
          </div>
        </div>
        <div className="action-row left">
          <button className="secondary-btn" onClick={onResetDemo} type="button"><RotateCcw size={17} /> Resetar dados demo</button>
          <button className="secondary-btn danger-text" onClick={onClearLocal} type="button"><Trash2 size={17} /> Limpar dados locais</button>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Exportar e importar</h2>
            <p>Backup local em JSON com treinos, metas, semana e histórico realizado.</p>
          </div>
        </div>
        <div className="action-row left">
          <button className="secondary-btn" onClick={onExport} type="button"><Download size={17} /> Exportar JSON</button>
          <button className="secondary-btn" onClick={() => inputRef.current?.click()} type="button"><Upload size={17} /> Importar JSON</button>
          <input ref={inputRef} hidden type="file" accept="application/json" onChange={(event) => void handleImport(event.target.files?.[0])} />
        </div>
        {importError ? <p className="empty compact">{importError}</p> : null}
      </section>
    </div>
  );
}
