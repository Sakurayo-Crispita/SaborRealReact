import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { apix } from "./api/api";

// Util: vista previa de imagen local
function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function ProfileModal({ open, onClose }) {
  const { token, email, profile = {}, setProfile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name ?? "",
    phone: profile?.phone ?? "",
    birthdate: profile?.birthdate ?? "",
    gender: profile?.gender ?? "na",
  });
  const [avatar, setAvatar] = useState(profile?.avatarUrl || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const passOldRef = useRef(null);
  const passNewRef = useRef(null);
  const passNew2Ref = useRef(null);

  // Sincroniza cuando se abre
  useEffect(() => {
    if (open) {
      setForm({
        name: profile?.name ?? "",
        phone: profile?.phone ?? "",
        birthdate: profile?.birthdate ?? "",
        gender: profile?.gender ?? "na",
      });
      setAvatar(profile?.avatarUrl || "");
      setMsg("");
    }
  }, [open, profile]);

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMsg("El archivo debe ser una imagen.");
    const dataUrl = await fileToDataURL(file);
    setAvatar(dataUrl); // vista previa inmediata
  };

  const saveProfile = async () => {
    setBusy(true); setMsg("");
    try {
      const payload = { ...form, email, avatar }; // avatar en base64 (simple)
      const updated = await apix.updateProfile(token, payload);
      // Actualiza el contexto si lo manejas allí:
      setProfile?.(updated ?? payload);
      setMsg("✅ Perfil actualizado.");
    } catch (e) {
      setMsg("❌ No se pudo actualizar el perfil.");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    setBusy(true); setMsg("");
    try {
      const oldp = passOldRef.current.value;
      const p1 = passNewRef.current.value;
      const p2 = passNew2Ref.current.value;
      if (!oldp || !p1) throw new Error("Completa las contraseñas.");
      if (p1 !== p2) throw new Error("Las contraseñas nuevas no coinciden.");
      await apix.changePassword(token, { oldPassword: oldp, newPassword: p1 });
      setMsg("🔒 Contraseña actualizada.");
      passOldRef.current.value = "";
      passNewRef.current.value = "";
      passNew2Ref.current.value = "";
    } catch (e) {
      setMsg("❌ No se pudo cambiar la contraseña.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="pmodal__backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="pmodal" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="pmodal__header">
          <img className="pmodal__brand" src="/logo192.png" alt="Sabor Real" />
          <h3 className="pmodal__title">Mi Perfil</h3>
          <button className="pmodal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Contenido */}
        <div className="pmodal__body">
          {/* Avatar */}
          <div className="pmodal__avatarBox">
            <div className="pmodal__avatar">
              {avatar ? <img src={avatar} alt="Avatar" /> : <div className="pmodal__avatarPh">👤</div>}
            </div>
            <label className="btn btn-outline-secondary btn-sm">
              Cambiar foto
              <input type="file" accept="image/*" hidden onChange={onPickAvatar} />
            </label>
          </div>

          {/* Datos */}
          <div className="pmodal__grid">
            <div className="form__grp">
              <label>Nombre de usuario</label>
              <input value={form.name}
                     onChange={e => setForm({ ...form, name: e.target.value })}
                     placeholder="Tu nombre" />
            </div>
            <div className="form__grp">
              <label>Correo electrónico</label>
              <input value={email} disabled />
            </div>
            <div className="form__grp">
              <label>Número de teléfono</label>
              <input value={form.phone}
                     onChange={e => setForm({ ...form, phone: e.target.value })}
                     placeholder="+51 ..." />
            </div>
            <div className="form__grp">
              <label>Fecha de nacimiento</label>
              <input type="date" value={form.birthdate}
                     onChange={e => setForm({ ...form, birthdate: e.target.value })} />
            </div>
            <div className="form__grp">
              <label>Género</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="na">Prefiero no decirlo</option>
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary pmodal__save" onClick={saveProfile} disabled={busy}>
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>

          {/* Cambiar contraseña */}
          <div className="pmodal__divider" />
          <h4 className="pmodal__subtitle">Cambiar contraseña</h4>
          <div className="pmodal__grid3">
            <div className="form__grp"><label>Contraseña actual</label><input type="password" ref={passOldRef} /></div>
            <div className="form__grp"><label>Nueva contraseña</label><input type="password" ref={passNewRef} /></div>
            <div className="form__grp"><label>Confirmar nueva</label><input type="password" ref={passNew2Ref} /></div>
          </div>
          <button className="btn btn-accent" onClick={changePassword} disabled={busy}>
            Actualizar contraseña
          </button>

          {msg && <div className="pmodal__msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
