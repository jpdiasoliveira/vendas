import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import type { StorePublicProfile } from "@/contracts/storePublicProfile";
import { lifestyleTitleFromStore } from "@/react-app/constants/storefrontHomeCopy";
import { AdminPreviewLinkHint } from "@/react-app/components/admin/AdminPreviewLinkHint";
import {
  adminPreviewScrollTargetId,
  type StorefrontPreviewSectionId,
} from "@/react-app/components/admin/storefrontPreviewLink";
import type { AdminProfileImageField } from "@/react-app/hooks/useAdminSettings";

type AdminSettingsHomeBlocksFormProps = {
  displayName: string;
  publicProfile: StorePublicProfile;
  setPublicProfile: Dispatch<SetStateAction<StorePublicProfile>>;
  inputCls: string;
  previewFocus: (id: StorefrontPreviewSectionId) => void;
  previewBlur: () => void;
  uploadingProfileImage: AdminProfileImageField | null;
  onProfileImageFile: (field: AdminProfileImageField) => (e: ChangeEvent<HTMLInputElement>) => void;
};

const opt = (v: string): string | undefined => (v.trim() === "" ? undefined : v);

/** Título/texto sobre a foto (lifestyle): vazio é `""` para gravar «sem linha», não voltar ao texto padrão. */
const trimCaption = (v: string) => v.trim();

type FpProps = { onFocus: () => void; onBlur: () => void };

const HomeBlockImageUrlField = ({
  field,
  label,
  section,
  value,
  setPublicProfile,
  inputCls,
  fp,
  uploading,
  onProfileImageFile,
}: {
  field: AdminProfileImageField;
  label: string;
  section: StorefrontPreviewSectionId;
  value: string;
  setPublicProfile: Dispatch<SetStateAction<StorePublicProfile>>;
  inputCls: string;
  fp: (id: StorefrontPreviewSectionId) => FpProps;
  uploading: boolean;
  onProfileImageFile: (field: AdminProfileImageField) => (e: ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-[#6D4C41]">{label}</label>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <input
        id={`admin-form-url-${field}`}
        type="url"
        value={value}
        onChange={(e) =>
          setPublicProfile((prev) => ({ ...prev, [field]: opt(e.target.value) }))
        }
        placeholder="https://…"
        className={`${inputCls} min-w-0 sm:flex-1`}
        {...fp(section)}
      />
      <label
        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1B4332]/25 bg-white/90 px-4 py-2.5 text-sm font-medium text-[#6D4C41] transition-colors hover:border-[#1B4332]/45 hover:bg-white sm:w-auto sm:shrink-0 ${
          uploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={onProfileImageFile(field)}
        />
        {uploading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#1B4332]" /> : <ImagePlus className="h-5 w-5 shrink-0 text-[#6D4C41]" />}
        {uploading ? "A enviar…" : "Importar imagem"}
      </label>
    </div>
    <p className="mt-1 text-[11px] text-[#6D4C41]/75">
      Cole um URL ou importe um ficheiro — ao importar, abre o passo de zoom e posição (4:3 como na vitrine). Depois
      clique em «Salvar configurações» para publicar (o ficheiro é enviado ao confirmar o enquadramento).
    </p>
  </div>
);

export const AdminSettingsHomeBlocksForm = ({
  displayName,
  publicProfile,
  setPublicProfile,
  inputCls,
  previewFocus,
  previewBlur,
  uploadingProfileImage,
  onProfileImageFile,
}: AdminSettingsHomeBlocksFormProps) => {
  const p = publicProfile;
  const name = displayName.trim() || "Sua Loja";

  const fp = (id: StorefrontPreviewSectionId) => ({
    "aria-controls": adminPreviewScrollTargetId(id),
    "data-admin-preview-section": id,
    onPointerDownCapture: () => previewFocus(id),
    onFocus: () => {
      previewFocus(id);
    },
    onBlur: previewBlur,
  });

  return (
    <div className="space-y-8 rounded-2xl border border-[#1B4332]/12 bg-white/60 p-4 sm:p-5">
      <div>
        <h3 className="text-base font-semibold text-[#1B4332]">Página inicial — blocos abaixo do hero</h3>
        <p className="mt-1 text-xs text-[#6D4C41]/85 leading-relaxed">
          Cada grupo abaixo corresponde a uma parte da home. Ao focar um campo,{" "}
          <strong className="text-[#1B4332]">só o painel da direita</strong> rola e realça o bloco — o seu sítio no
          formulário mantém-se onde está.
        </p>
      </div>

      <div className="space-y-4 border-t border-[#1B4332]/10 pt-5">
        <h4 className="text-sm font-semibold text-[#1B4332]">Nossa história</h4>
        <AdminPreviewLinkHint section="story" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Selo (linha pequena)</label>
            <input
              id="storyEyebrow"
              type="text"
              value={p.storyEyebrow ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, storyEyebrow: opt(e.target.value) }))
              }
              placeholder="Ex.: Nossa Jornada"
              className={inputCls}
              {...fp("story")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Título da secção</label>
            <input
              type="text"
              value={p.storyHeading ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, storyHeading: opt(e.target.value) }))
              }
              placeholder="Nossa História"
              className={inputCls}
              {...fp("story")}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Texto (parágrafos)</label>
          <textarea
            rows={6}
            value={p.storyBody ?? ""}
            onChange={(e) =>
              setPublicProfile((prev) => ({ ...prev, storyBody: opt(e.target.value) }))
            }
            placeholder={`Um parágrafo por bloco — separe com linha em branco.\n\nEx.: primeiro parágrafo...\n\nSegundo parágrafo...`}
            className={`${inputCls} resize-y min-h-[120px]`}
            {...fp("story")}
          />
          <p className="mt-1 text-[11px] text-[#6D4C41]/75">
            Vazio = três parágrafos padrão (incluem o nome «{name}» no primeiro).
          </p>
        </div>
        <HomeBlockImageUrlField
          field="storyImageUrl"
          label="URL da foto grande (lado direito)"
          section="story"
          value={p.storyImageUrl ?? ""}
          setPublicProfile={setPublicProfile}
          inputCls={inputCls}
          fp={fp}
          uploading={uploadingProfileImage === "storyImageUrl"}
          onProfileImageFile={onProfileImageFile}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Chip 1 (ícone folha)</label>
            <input
              type="text"
              value={p.storyChip1 ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, storyChip1: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("story")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Chip 2 (ícone local)</label>
            <input
              type="text"
              value={p.storyChip2 ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, storyChip2: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("story")}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-[#1B4332]/10 pt-5">
        <h4 className="text-sm font-semibold text-[#1B4332]">Momentos / estilo de vida (duas fotos)</h4>
        <p className="text-[11px] text-[#6D4C41]/80 -mt-1 mb-1">
          Selo, título e subtítulo são o cabeçalho da secção; cada cartão tem a sua própria foto e textos.
        </p>
        <AdminPreviewLinkHint section="lifestyleHead" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Selo</label>
            <input
              id="lifestyleEyebrow"
              type="text"
              value={p.lifestyleEyebrow ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, lifestyleEyebrow: opt(e.target.value) }))
              }
              placeholder="Estilo de Vida"
              className={inputCls}
              {...fp("lifestyleHead")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Título principal</label>
            <input
              type="text"
              value={p.lifestyleTitle ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, lifestyleTitle: opt(e.target.value) }))
              }
              placeholder={lifestyleTitleFromStore(name)}
              className={inputCls}
              {...fp("lifestyleHead")}
            />
            <p className="mt-1 text-[11px] text-[#6D4C41]/75">Vazio = «{lifestyleTitleFromStore(name)}».</p>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Subtítulo abaixo do título</label>
          <input
            type="text"
            value={p.lifestyleSubtitle ?? ""}
            onChange={(e) =>
              setPublicProfile((prev) => ({ ...prev, lifestyleSubtitle: opt(e.target.value) }))
            }
            className={inputCls}
            {...fp("lifestyleHead")}
          />
        </div>

        <p className="text-xs font-medium text-[#1B4332]/90 pt-2">Cartão da esquerda</p>
        <AdminPreviewLinkHint section="lifestyleLeft" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <HomeBlockImageUrlField
              field="lifestyleLeftImageUrl"
              label="URL da foto"
              section="lifestyleLeft"
              value={p.lifestyleLeftImageUrl ?? ""}
              setPublicProfile={setPublicProfile}
              inputCls={inputCls}
              fp={fp}
              uploading={uploadingProfileImage === "lifestyleLeftImageUrl"}
              onProfileImageFile={onProfileImageFile}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Título sobre a foto</label>
            <input
              type="text"
              value={p.lifestyleLeftTitle ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, lifestyleLeftTitle: trimCaption(e.target.value) }))
              }
              className={inputCls}
              {...fp("lifestyleLeft")}
            />
            <p className="mt-1 text-[11px] text-[#6D4C41]/75">Vazio = sem título sobre a foto.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Texto sobre a foto</label>
            <input
              type="text"
              value={p.lifestyleLeftText ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, lifestyleLeftText: trimCaption(e.target.value) }))
              }
              className={inputCls}
              {...fp("lifestyleLeft")}
            />
            <p className="mt-1 text-[11px] text-[#6D4C41]/75">Vazio = sem essa linha sobre a foto (pré-visualização e loja).</p>
          </div>
        </div>

        <p className="text-xs font-medium text-[#1B4332]/90 pt-2">Cartão da direita</p>
        <AdminPreviewLinkHint section="lifestyleRight" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <HomeBlockImageUrlField
              field="lifestyleRightImageUrl"
              label="URL da foto"
              section="lifestyleRight"
              value={p.lifestyleRightImageUrl ?? ""}
              setPublicProfile={setPublicProfile}
              inputCls={inputCls}
              fp={fp}
              uploading={uploadingProfileImage === "lifestyleRightImageUrl"}
              onProfileImageFile={onProfileImageFile}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Título sobre a foto</label>
            <input
              type="text"
              value={p.lifestyleRightTitle ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, lifestyleRightTitle: trimCaption(e.target.value) }))
              }
              className={inputCls}
              {...fp("lifestyleRight")}
            />
            <p className="mt-1 text-[11px] text-[#6D4C41]/75">Vazio = sem título sobre a foto.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Texto sobre a foto</label>
            <input
              type="text"
              value={p.lifestyleRightText ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, lifestyleRightText: trimCaption(e.target.value) }))
              }
              className={inputCls}
              {...fp("lifestyleRight")}
            />
            <p className="mt-1 text-[11px] text-[#6D4C41]/75">Vazio = sem essa linha sobre a foto (pré-visualização e loja).</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-[#1B4332]/10 pt-5">
        <h4 className="text-sm font-semibold text-[#1B4332]">Faixa verde — três benefícios</h4>
        <AdminPreviewLinkHint section="benefits" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Benefício 1 — título</label>
            <input
              id="benefit1Title"
              type="text"
              value={p.benefit1Title ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, benefit1Title: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("benefits")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Benefício 1 — texto</label>
            <input
              type="text"
              value={p.benefit1Text ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, benefit1Text: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("benefits")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Benefício 2 — título</label>
            <input
              type="text"
              value={p.benefit2Title ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, benefit2Title: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("benefits")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Benefício 2 — texto</label>
            <input
              type="text"
              value={p.benefit2Text ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, benefit2Text: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("benefits")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Benefício 3 — título</label>
            <input
              type="text"
              value={p.benefit3Title ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, benefit3Title: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("benefits")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Benefício 3 — texto</label>
            <input
              type="text"
              value={p.benefit3Text ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, benefit3Text: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("benefits")}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-[#1B4332]/10 pt-5">
        <h4 className="text-sm font-semibold text-[#1B4332]">Newsletter</h4>
        <AdminPreviewLinkHint section="newsletter" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Selo</label>
            <input
              id="newsletterEyebrow"
              type="text"
              value={p.newsletterEyebrow ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, newsletterEyebrow: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("newsletter")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Título</label>
            <input
              type="text"
              value={p.newsletterTitle ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, newsletterTitle: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("newsletter")}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Subtítulo</label>
          <input
            type="text"
            value={p.newsletterSubtitle ?? ""}
            onChange={(e) =>
              setPublicProfile((prev) => ({ ...prev, newsletterSubtitle: opt(e.target.value) }))
            }
            className={inputCls}
            {...fp("newsletter")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Placeholder do e-mail</label>
            <input
              type="text"
              value={p.newsletterPlaceholder ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, newsletterPlaceholder: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("newsletter")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6D4C41]">Texto do botão</label>
            <input
              type="text"
              value={p.newsletterCtaLabel ?? ""}
              onChange={(e) =>
                setPublicProfile((prev) => ({ ...prev, newsletterCtaLabel: opt(e.target.value) }))
              }
              className={inputCls}
              {...fp("newsletter")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
