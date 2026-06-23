import { useEffect, useMemo, useRef, useState } from "react"
import { publicImageUrl, STORAGE_BUCKET, supabase } from "../../lib/supabase"
import type { GalleryRow, ImageRow } from "../../lib/types"
import { useGalleries } from "../../hooks/useGalleries"
import {
  galleryConfig,
  GALLERY_TYPES,
  type GalleryTypeConfig,
} from "../../lib/galleryTypes"
import { generateThumbBlob, thumbStoragePath } from "../../lib/imageThumb"

interface Props {
  email: string
  onSignOut: () => void
}

function extFromName(name: string): string {
  const m = name.toLowerCase().match(/\.[a-z0-9]+$/)
  return m ? m[0] : ""
}

export function AdminPanel({ email, onSignOut }: Props) {
  const { reload } = useGalleries()
  const [galleries, setGalleries] = useState<GalleryRow[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [images, setImages] = useState<ImageRow[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [filter, setFilter] = useState("")
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  useEffect(() => {
    void loadGalleries()
  }, [])

  useEffect(() => {
    if (selectedId) void loadImages(selectedId)
    else setImages([])
  }, [selectedId])

  async function loadGalleries() {
    const { data, error } = await supabase
      .from("galleries")
      .select("*")
      .order("sort_order", { ascending: true })
    if (error) return setMsg(`gallery load: ${error.message}`)
    const all = (data ?? []) as GalleryRow[]
    const managed = all.filter((g) => g.id in GALLERY_TYPES)
    setGalleries(managed)
    if (!selectedId && managed.length) setSelectedId(managed[0].id)
  }

  async function loadImages(galleryId: string) {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("sort_order", { ascending: true })
    if (error) return setMsg(`image load: ${error.message}`)
    setImages((data ?? []) as ImageRow[])
  }

  async function refreshAll() {
    if (selectedId) await loadImages(selectedId)
    await reload()
    setLastSavedAt(Date.now())
  }

  async function addItem(payload: {
    file: File
    title: string
    link: string | null
  }) {
    if (!selectedId) return
    const cfg = galleryConfig(selectedId)
    if (!cfg) return setMsg("unsupported gallery")

    setBusy(true)
    setMsg(null)
    const baseOrder = images.length
      ? Math.max(...images.map((i) => i.sort_order)) + 1
      : 0
    const ts = Date.now()
    const safeName = `${ts}${extFromName(payload.file.name)}`
    const storagePath = `${selectedId}/${safeName}`

    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, payload.file, {
        contentType: payload.file.type,
        upsert: false,
      })
    if (upErr) {
      setBusy(false)
      return setMsg(`upload: ${upErr.message}`)
    }

    // Thumb is best-effort: master is already up; grid falls back to it via
    // onError if the thumb is missing. Log a soft warning if it fails so we
    // don't silently ship slow images.
    try {
      const thumb = await generateThumbBlob(payload.file)
      const { error: thumbErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(thumbStoragePath(storagePath), thumb, {
          contentType: "image/webp",
          upsert: true,
        })
      if (thumbErr) console.warn("thumb upload failed:", thumbErr.message)
    } catch (e) {
      console.warn("thumb generation failed:", (e as Error).message)
    }

    const { error: insErr } = await supabase.from("images").insert({
      gallery_id: selectedId,
      storage_path: storagePath,
      title: payload.title || null,
      alt: payload.title || null,
      link: cfg.hasLink ? payload.link : null,
      sort_order: baseOrder,
    })
    if (insErr) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath, thumbStoragePath(storagePath)])
      setBusy(false)
      return setMsg(`insert: ${insErr.message}`)
    }

    setBusy(false)
    setMsg("Added.")
    await refreshAll()
  }

  async function updateImage(id: string, patch: Partial<ImageRow>) {
    const { error } = await supabase.from("images").update(patch).eq("id", id)
    if (error) return setMsg(`update: ${error.message}`)
    await refreshAll()
  }

  async function deleteImage(img: ImageRow) {
    const label = img.title ? `"${img.title}"` : "this image"
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return
    setBusy(true)
    setMsg(null)
    const { error: sErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([img.storage_path, thumbStoragePath(img.storage_path)])
    if (sErr) {
      setBusy(false)
      return setMsg(`storage: ${sErr.message}`)
    }
    const { error } = await supabase.from("images").delete().eq("id", img.id)
    setBusy(false)
    if (error) return setMsg(`db delete: ${error.message}`)
    await refreshAll()
  }

  async function moveImage(img: ImageRow, dir: -1 | 1) {
    const idx = images.findIndex((i) => i.id === img.id)
    const swap = images[idx + dir]
    if (!swap) return
    await supabase
      .from("images")
      .update({ sort_order: swap.sort_order })
      .eq("id", img.id)
    await supabase
      .from("images")
      .update({ sort_order: img.sort_order })
      .eq("id", swap.id)
    await refreshAll()
  }

  const selectedGallery = useMemo(
    () => galleries.find((g) => g.id === selectedId),
    [galleries, selectedId]
  )
  const cfg = useMemo(
    () => (selectedId ? galleryConfig(selectedId) : undefined),
    [selectedId]
  )

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return images
    return images.filter(
      (i) =>
        (i.title ?? "").toLowerCase().includes(q) ||
        i.storage_path.toLowerCase().includes(q)
    )
  }, [images, filter])

  return (
    <div className="admin-panel flex flex-col h-full text-xs">
      {/* Header */}
      <div
        className="field-row"
        style={{ justifyContent: "space-between", padding: "6px 8px 0" }}
      >
        <span>
          Signed in: <b>{email}</b>
        </span>
        <button onClick={onSignOut}>Sign out</button>
      </div>

      {msg && (
        <p className="text-[11px]" style={{ padding: "0 8px" }}>
          {msg}
        </p>
      )}

      {/* Body: two-column on wide screens */}
      <div className="flex-1 overflow-auto p-2 grid gap-2 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-start">
        {/* Left column: gallery + add form (sticky on lg) */}
        <div className="flex flex-col gap-2 lg:sticky lg:top-0">
          <fieldset>
            <legend>Gallery</legend>
            <div className="field-row">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={busy}
              >
                {galleries.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {cfg && (
                <span className="ml-2 text-[11px] text-gray-700">
                  type: <b>{cfg.kind}</b>
                </span>
              )}
            </div>
          </fieldset>

          {selectedGallery && cfg && (
            <AddItemForm
              key={selectedId}
              galleryName={selectedGallery.name}
              cfg={cfg}
              busy={busy}
              onSubmit={addItem}
            />
          )}
        </div>

        {/* Right column: items */}
        {selectedGallery && cfg && (
          <fieldset>
            <legend>
              Items — {selectedGallery.name} ({images.length})
            </legend>
            <div className="field-row-stacked" style={{ marginBottom: 6 }}>
              <label htmlFor="admin-filter">Filter</label>
              <input
                id="admin-filter"
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search title or path..."
              />
            </div>
            <div className="flex flex-col gap-1">
              {images.length === 0 && <p>No items yet.</p>}
              {images.length > 0 && filtered.length === 0 && (
                <p>No matches for "{filter}".</p>
              )}
              {filtered.map((img) => {
                const idx = images.findIndex((i) => i.id === img.id)
                return (
                  <ImageRowEditor
                    key={img.id}
                    img={img}
                    cfg={cfg}
                    isFirst={idx === 0}
                    isLast={idx === images.length - 1}
                    onUpdate={(patch) => updateImage(img.id, patch)}
                    onDelete={() => deleteImage(img)}
                    onMoveUp={() => moveImage(img, -1)}
                    onMoveDown={() => moveImage(img, 1)}
                  />
                )
              })}
            </div>
          </fieldset>
        )}
      </div>

      {/* Status bar */}
      <div className="admin-status-bar">
        <span>
          {busy
            ? "Working..."
            : selectedGallery
            ? `${images.length} item${images.length === 1 ? "" : "s"}${
                filter ? ` · ${filtered.length} shown` : ""
              }`
            : "Ready"}
        </span>
        <span>
          {lastSavedAt
            ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString()}`
            : "—"}
        </span>
      </div>
    </div>
  )
}

function AddItemForm({
  galleryName,
  cfg,
  busy,
  onSubmit,
}: {
  galleryName: string
  cfg: GalleryTypeConfig
  busy: boolean
  onSubmit: (p: { file: File; title: string; link: string | null }) => Promise<void>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [link, setLink] = useState("")
  const [fileName, setFileName] = useState("")

  const linkValid =
    !cfg.hasLink ||
    (!cfg.linkRequired && link.trim() === "") ||
    (link.trim().length > 0 &&
      (!cfg.linkHostHint || link.toLowerCase().includes(cfg.linkHostHint)))

  const canSubmit =
    !busy &&
    !!fileName &&
    title.trim().length > 0 &&
    linkValid &&
    (!cfg.linkRequired || link.trim().length > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    await onSubmit({
      file,
      title: title.trim(),
      link: cfg.hasLink ? link.trim() || null : null,
    })
    setTitle("")
    setLink("")
    setFileName("")
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <fieldset>
      <legend>Add to {galleryName}</legend>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="field-row-stacked">
          <label>Image file (required)</label>
          <div className="file-picker">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              Browse...
            </button>
            <span className="file-picker-name" title={fileName}>
              {fileName || "No file selected"}
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="admin-file-hidden"
            disabled={busy}
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          />
          <p className="admin-hint">Recommended: WebP, up to ~1 MB. The small grid cover is generated automatically.</p>
        </div>
        <div className="field-row-stacked">
          <label>
            {cfg.kind === "video"
              ? "Video title"
              : cfg.kind === "audio"
              ? "Album title"
              : "Title"}{" "}
            (required)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
          />
        </div>
        {cfg.hasLink && (
          <div className="field-row-stacked">
            <label>{cfg.linkLabel ?? "Link"}</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={busy}
              placeholder={
                cfg.linkHostHint === "youtu"
                  ? "https://youtu.be/..."
                  : cfg.linkHostHint === "spotify"
                  ? "https://open.spotify.com/album/..."
                  : ""
              }
            />
            {!linkValid && link && (
              <p className="text-red-700 text-[10px]">
                Link should contain "{cfg.linkHostHint}"
              </p>
            )}
          </div>
        )}
        <div className="field-row">
          <button type="submit" disabled={!canSubmit}>
            {busy ? "Saving..." : "+ Add"}
          </button>
        </div>
      </form>
    </fieldset>
  )
}

function ImageRowEditor({
  img,
  cfg,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  img: ImageRow
  cfg: GalleryTypeConfig
  isFirst: boolean
  isLast: boolean
  onUpdate: (patch: Partial<ImageRow>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [title, setTitle] = useState(img.title ?? "")
  const [link, setLink] = useState(img.link ?? "")

  useEffect(() => {
    setTitle(img.title ?? "")
    setLink(img.link ?? "")
  }, [img.id, img.title, img.link])

  const dirty =
    (title || "") !== (img.title ?? "") ||
    (cfg.hasLink && (link || "") !== (img.link ?? ""))

  return (
    <div className="admin-row flex gap-2 items-start">
      <img
        src={publicImageUrl(img.storage_path)}
        alt={img.alt ?? img.title ?? ""}
        className="admin-thumb"
        loading="lazy"
      />
      <div className="flex-1 flex flex-col gap-1">
        <div className="field-row-stacked">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {cfg.hasLink && (
          <div className="field-row-stacked">
            <label>{cfg.linkLabel ?? "Link"}</label>
            <input value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
        )}
        <p className="text-[10px] text-gray-600 break-all">
          {img.storage_path} · order {img.sort_order}
        </p>
        <div className="field-row">
          <button
            disabled={!dirty}
            onClick={() =>
              onUpdate({
                title: title || null,
                alt: title || null,
                ...(cfg.hasLink ? { link: link || null } : {}),
              })
            }
          >
            Save
          </button>
          <button onClick={onDelete}>Delete</button>
        </div>
      </div>
      <div className="admin-reorder">
        <button
          className="admin-sq"
          onClick={onMoveUp}
          disabled={isFirst}
          title="Move up"
          aria-label="Move up"
        >
          ↑
        </button>
        <button
          className="admin-sq"
          onClick={onMoveDown}
          disabled={isLast}
          title="Move down"
          aria-label="Move down"
        >
          ↓
        </button>
      </div>
    </div>
  )
}
