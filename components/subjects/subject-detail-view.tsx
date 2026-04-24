"use client";

import type { Dispatch, InputHTMLAttributes, SetStateAction } from "react";
import { memo, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FileText, FolderClosed, FolderTree, Layers3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Subject, SubjectResource, SubjectSection, Teacher } from "@/lib/types";
import {
  getFileDownloadHref,
  getFileViewerHref,
  getSubjectResourceDownloadHref,
  getSubjectResourceViewerHref
} from "@/lib/utils";

type ResourceType = SubjectResource["type"];

type ResourceNode = SubjectResource & {
  children: ResourceNode[];
};

function labelForResourceType(type: ResourceType) {
  if (type === "section") return "Section";
  if (type === "folder") return "Folder";
  return "File";
}

function ResourceIcon({ type }: { type: ResourceType }) {
  if (type === "section") {
    return <Layers3 className="size-4" />;
  }

  if (type === "folder") {
    return <FolderTree className="size-4" />;
  }

  return <FileText className="size-4" />;
}

const RESOURCE_TYPE_ORDER: Record<ResourceType, number> = {
  section: 0,
  folder: 1,
  file: 2
};

function toDisplayMessage(value: unknown, fallback = "Upload failed.") {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (value && typeof value === "object") {
    if ("message" in value && typeof (value as { message?: unknown }).message === "string") {
      return String((value as { message: string }).message);
    }

    if ("error" in value) {
      return toDisplayMessage((value as { error?: unknown }).error, fallback);
    }
  }

  return fallback;
}

const ResourceCreator = memo(function ResourceCreator({
  subjectId,
  sectionId,
  parentResourceId,
  initialNodeIds,
  saveSubjectResourceAction
}: {
  subjectId: string;
  sectionId: string;
  parentResourceId?: string;
  initialNodeIds: string[];
  saveSubjectResourceAction: (formData: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const parseErrorText = async (response: Response) => {
    const text = await response.text();
    try {
      const data = JSON.parse(text) as { error?: unknown; message?: unknown };
      return toDisplayMessage(data, text || "Upload failed.");
    } catch {
      return toDisplayMessage(text, "Upload failed.");
    }
  };

  const uploadFiles = (files: File[], displayName: string) => {
    startTransition(async () => {
      try {
        setMessage("");
        const signatureResponse = await fetch("/api/cloudinary/signature", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            folder: `academic-files/subjects/${subjectId}`,
            resourceType: "raw"
          })
        });

        if (!signatureResponse.ok) {
          setMessage(await parseErrorText(signatureResponse));
          return;
        }

        const signatureData = (await signatureResponse.json()) as {
          cloudName: string;
          apiKey: string;
          folder: string;
          resourceType: string;
          timestamp: number;
          signature: string;
        };

        const uploadedFiles: Array<{
          secureUrl: string;
          publicId: string;
          resourceType?: string;
          format?: string;
          fileType?: string;
          originalName?: string;
          relativePath?: string;
          fileSize?: number;
          displayName?: string;
        }> = [];

        for (const file of files) {
          const cloudinaryData = new FormData();
          cloudinaryData.append("file", file);
          cloudinaryData.append("api_key", signatureData.apiKey);
          cloudinaryData.append("timestamp", String(signatureData.timestamp));
          cloudinaryData.append("signature", signatureData.signature);
          cloudinaryData.append("folder", signatureData.folder);
          cloudinaryData.append("resource_type", signatureData.resourceType);

          const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/raw/upload`, {
            method: "POST",
            body: cloudinaryData
          });

          if (!uploadResponse.ok) {
            setMessage(await parseErrorText(uploadResponse));
            return;
          }

          const uploadResult = (await uploadResponse.json()) as {
            secure_url: string;
            public_id: string;
            resource_type?: string;
            format?: string;
          };

          uploadedFiles.push({
            secureUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            resourceType: uploadResult.resource_type || "raw",
            format: uploadResult.format || "",
            fileType: file.type || "unknown",
            originalName: file.name,
            relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || "",
            fileSize: file.size,
            displayName: file.name || displayName
          });
        }

        const metadataResponse = await fetch("/api/subject-resources", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            subjectId,
            sectionId,
            parentResourceId: parentResourceId || "",
            name: displayName,
            files: uploadedFiles
          })
        });

        const metadataText = await metadataResponse.text();
        let metadataData: { error?: unknown; message?: unknown; count?: number } | null = null;

        try {
          metadataData = JSON.parse(metadataText) as { error?: unknown; message?: unknown; count?: number };
        } catch {
          metadataData = null;
        }

        if (!metadataResponse.ok) {
          setMessage(toDisplayMessage(metadataData ?? metadataText, metadataText || "Upload failed."));
          return;
        }

        setMessage(`${metadataData?.count || files.length} file(s) uploaded successfully.`);
        const params = new URLSearchParams();
        params.set("section", sectionId);
        initialNodeIds.forEach((id) => params.append("node", id));
        if (parentResourceId) {
          params.append("node", parentResourceId);
        }
        router.replace(`/subjects/${subjectId}?${params.toString()}`);
      } catch (error) {
        setMessage(toDisplayMessage(error));
      }
    });
  };

  return (
    <div className="space-y-3 rounded-[24px] border border-border bg-muted/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Add inside here</p>

      <form action={saveSubjectResourceAction} className="grid gap-3 xl:grid-cols-[160px_1fr_auto]">
        <input type="hidden" name="subjectId" value={subjectId} />
        <input type="hidden" name="sectionId" value={sectionId} />
        <input type="hidden" name="parentResourceId" value={parentResourceId || ""} />
        <select name="type" defaultValue="section" className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent">
          <option value="section">Section</option>
          <option value="folder">Folder</option>
        </select>
        <input name="name" placeholder="Section or folder name" required className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent" />
        <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white">Create item</button>
      </form>

      <form
        encType="multipart/form-data"
        className="grid gap-3 xl:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const sourceData = new FormData(event.currentTarget);
          const file = sourceData.get("file");
          if (!(file instanceof File) || file.size === 0) {
            setMessage("Please choose a file to upload.");
            return;
          }
          uploadFiles([file], String(sourceData.get("name") || "").trim() || file.name);
        }}
      >
        <input type="hidden" name="subjectId" value={subjectId} />
        <input type="hidden" name="sectionId" value={sectionId} />
        <input type="hidden" name="parentResourceId" value={parentResourceId || ""} />
        <input type="hidden" name="type" value="file" />
        <input name="name" placeholder="Single file title (optional)" className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent" />
        <input
          name="file"
          type="file"
          className="rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm"
        />
        <button
          disabled={isPending}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text disabled:cursor-not-allowed disabled:opacity-60 xl:col-span-3"
        >
          {isPending ? "Uploading..." : "Upload single file"}
        </button>
      </form>

      <form
        encType="multipart/form-data"
        className="grid gap-3 xl:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const sourceData = new FormData(event.currentTarget);
          const files = sourceData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
          if (!files.length) {
            setMessage("Please choose file(s) to upload.");
            return;
          }
          uploadFiles(files, "Uploaded files");
        }}
      >
        <input type="hidden" name="subjectId" value={subjectId} />
        <input type="hidden" name="sectionId" value={sectionId} />
        <input type="hidden" name="parentResourceId" value={parentResourceId || ""} />
        <input type="hidden" name="type" value="file" />
        <input type="hidden" name="name" value="Uploaded files" />
        <input
          name="files"
          type="file"
          multiple
          className="rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm"
        />
        <button
          disabled={isPending}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Uploading..." : "Upload files"}
        </button>
      </form>

      <form
        encType="multipart/form-data"
        className="grid gap-3 xl:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const sourceData = new FormData(event.currentTarget);
          const files = sourceData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
          if (!files.length) {
            setMessage("Please choose a folder to upload.");
            return;
          }
          uploadFiles(files, "Uploaded folder");
        }}
      >
        <input type="hidden" name="subjectId" value={subjectId} />
        <input type="hidden" name="sectionId" value={sectionId} />
        <input type="hidden" name="parentResourceId" value={parentResourceId || ""} />
        <input type="hidden" name="type" value="file" />
        <input type="hidden" name="name" value="Uploaded folder" />
        <input
          {...({
            webkitdirectory: "",
            directory: "",
            multiple: true
          } as InputHTMLAttributes<HTMLInputElement>)}
          name="files"
          type="file"
          className="rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm"
        />
        <button
          disabled={isPending}
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-text disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Uploading..." : "Upload entire folder"}
        </button>
      </form>

      {message ? <p className="rounded-2xl bg-card px-4 py-3 text-sm text-subtle">{message}</p> : null}
    </div>
  );
});

const ResourceTree = memo(function ResourceTree({
  node,
  subjectId,
  sectionId,
  isAdmin,
  openIds,
  setOpenIds,
  saveSubjectResourceAction,
  deleteSubjectResourceAction
}: {
  node: ResourceNode;
  subjectId: string;
  sectionId: string;
  isAdmin: boolean;
  openIds: Set<string>;
  setOpenIds: Dispatch<SetStateAction<Set<string>>>;
  saveSubjectResourceAction: (formData: FormData) => void | Promise<void>;
  deleteSubjectResourceAction: (formData: FormData) => void | Promise<void>;
}) {
  const hasChildren = node.children.length > 0;
  const isContainer = node.type !== "file";
  const isOpen = openIds.has(node.id);

  const toggleOpen = () => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  };

  return (
    <div className="rounded-[24px] border border-border bg-muted/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={isContainer ? toggleOpen : undefined}
            className={`mt-0.5 rounded-full p-1 text-subtle ${isContainer ? "hover:bg-card" : "pointer-events-none opacity-40"}`}
          >
            <ChevronDown className={`size-4 transition ${isOpen ? "rotate-180" : ""}`} />
          </button>
          <span className="mt-1 text-subtle">
            <ResourceIcon type={node.type} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-all text-sm font-medium text-text">{node.name}</p>
              <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle">
                {labelForResourceType(node.type)}
              </span>
            </div>
            {node.type === "file" ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
                <a href={getSubjectResourceViewerHref(node.id)} className="text-accent">
                  Open
                </a>
                <a href={getSubjectResourceDownloadHref(node.id)} target="_blank" rel="noreferrer" className="text-accent">
                  Download
                </a>
              </div>
            ) : (
              <p className="mt-2 text-xs text-subtle">{hasChildren ? `${node.children.length} item(s) inside` : "Empty container"}</p>
            )}
          </div>
        </div>

        {isAdmin ? (
          <form action={deleteSubjectResourceAction}>
            <input type="hidden" name="id" value={node.id} />
            <button className="text-xs font-medium text-danger">Delete</button>
          </form>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {isContainer && isOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-l border-border/70 pl-4">
              {isAdmin ? (
                <ResourceCreator
                  subjectId={subjectId}
                  sectionId={sectionId}
                  parentResourceId={node.id}
                  initialNodeIds={Array.from(openIds)}
                  saveSubjectResourceAction={saveSubjectResourceAction}
                />
              ) : null}

              {node.children.length ? (
                node.children.map((child) => (
                  <ResourceTree
                    key={child.id}
                    node={child}
                    subjectId={subjectId}
                    sectionId={sectionId}
                    isAdmin={isAdmin}
                    openIds={openIds}
                    setOpenIds={setOpenIds}
                    saveSubjectResourceAction={saveSubjectResourceAction}
                    deleteSubjectResourceAction={deleteSubjectResourceAction}
                  />
                ))
              ) : (
                <p className="text-sm text-subtle">Nothing has been published inside this {labelForResourceType(node.type).toLowerCase()} yet.</p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});

export function SubjectDetailView({
  subject,
  sections,
  resources,
  legacyFiles,
  teachers,
  isAdmin,
  initialOpenSectionId,
  initialOpenResourceIds,
  saveSubjectSectionAction,
  saveSubjectResourceAction,
  deleteSubjectSectionAction,
  deleteSubjectResourceAction
}: {
  subject: Subject;
  sections: SubjectSection[];
  resources: SubjectResource[];
  legacyFiles: { id: string; title: string }[];
  teachers: Teacher[];
  isAdmin: boolean;
  initialOpenSectionId: string;
  initialOpenResourceIds: string[];
  saveSubjectSectionAction: (formData: FormData) => void | Promise<void>;
  saveSubjectResourceAction: (formData: FormData) => void | Promise<void>;
  deleteSubjectSectionAction: (formData: FormData) => void | Promise<void>;
  deleteSubjectResourceAction: (formData: FormData) => void | Promise<void>;
}) {
  const [openSectionId, setOpenSectionId] = useState(initialOpenSectionId || sections[0]?.id || "");
  const [openResourceIds, setOpenResourceIds] = useState<Set<string>>(() => new Set(initialOpenResourceIds));

  const resourceTreesBySection = useMemo(() => {
    const bySection = new Map<string, ResourceNode[]>();
    const resourcesBySection = new Map<string, SubjectResource[]>();

    resources.forEach((resource) => {
      const current = resourcesBySection.get(resource.sectionId);
      if (current) {
        current.push(resource);
      } else {
        resourcesBySection.set(resource.sectionId, [resource]);
      }
    });

    const sortNodes = (nodes: ResourceNode[]) => {
      nodes.sort((left, right) => {
        const typeDelta = RESOURCE_TYPE_ORDER[left.type] - RESOURCE_TYPE_ORDER[right.type];
        if (typeDelta !== 0) return typeDelta;
        return left.name.localeCompare(right.name);
      });
      nodes.forEach((node) => sortNodes(node.children));
    };

    for (const section of sections) {
      const sectionResources = resourcesBySection.get(section.id) || [];
      const resourceMap = new Map<string, ResourceNode>();

      for (const resource of sectionResources) {
        resourceMap.set(resource.id, { ...resource, children: [] });
      }

      const roots: ResourceNode[] = [];
      for (const resource of sectionResources) {
        const node = resourceMap.get(resource.id);
        if (!node) continue;

        const parentId = String(resource.parentResourceId || "");
        const parentNode = parentId ? resourceMap.get(parentId) : undefined;

        if (parentNode) {
          parentNode.children.push(node);
        } else {
          roots.push(node);
        }
      }

      sortNodes(roots);
      bySection.set(section.id, roots);
    }

    return bySection;
  }, [resources, sections]);

  return (
    <div className="space-y-5">
      <div className="rounded-[32px] border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Subject Box
          </span>
          <span className="text-xs text-subtle">{subject.semesterName || "No semester"}</span>
        </div>
        <h2 className="mt-4 font-heading text-3xl font-bold text-text">{subject.name}</h2>
        <p className="mt-2 text-sm text-subtle">{subject.code}</p>
      </div>

      {isAdmin ? (
        <div className="rounded-[28px] border border-border bg-card p-5">
          <p className="text-sm font-semibold text-text">Create top-level section</p>
          <form action={saveSubjectSectionAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_220px_auto]">
            <input type="hidden" name="subjectId" value={subject.id} />
            <input name="name" placeholder="Section name" required className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent" />
            <select name="kind" defaultValue="custom" className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent">
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="custom">Custom</option>
            </select>
            <select name="teacherId" defaultValue="" className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent">
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white">Save</button>
          </form>
        </div>
      ) : null}

      <div className="space-y-4">
        {sections.map((section) => {
          const sectionResources = resourceTreesBySection.get(section.id) || [];
          const isOpen = openSectionId === section.id;

          return (
            <div key={section.id} className="rounded-[28px] border border-border bg-card p-5">
              <button
                type="button"
                onClick={() => setOpenSectionId(isOpen ? "" : section.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-subtle">
                      {section.kind}
                    </span>
                    {section.teacherName ? (
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-text">
                        {section.teacherName}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 font-medium text-text">{section.name}</p>
                  <p className="mt-1 text-sm text-subtle">{sectionResources.length} top-level item(s)</p>
                </div>
                <ChevronDown className={`mt-1 size-5 text-subtle transition ${isOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4">
                      {isAdmin ? (
                        <ResourceCreator
                          subjectId={subject.id}
                          sectionId={section.id}
                          initialNodeIds={[]}
                          saveSubjectResourceAction={saveSubjectResourceAction}
                        />
                      ) : null}

                      {sectionResources.length ? (
                        sectionResources.map((resource) => (
                          <ResourceTree
                            key={resource.id}
                            node={resource}
                            subjectId={subject.id}
                            sectionId={section.id}
                            isAdmin={isAdmin}
                            openIds={openResourceIds}
                            setOpenIds={setOpenResourceIds}
                            saveSubjectResourceAction={saveSubjectResourceAction}
                            deleteSubjectResourceAction={deleteSubjectResourceAction}
                          />
                        ))
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-border bg-muted/25 p-5 text-sm text-subtle">
                          Nothing published in this section yet.
                        </div>
                      )}

                      {isAdmin ? (
                        <form action={deleteSubjectSectionAction}>
                          <input type="hidden" name="id" value={section.id} />
                          <button className="text-xs font-medium text-danger">Delete top-level section</button>
                        </form>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {legacyFiles.length ? (
        <div className="rounded-[28px] border border-border bg-card p-5">
          <p className="text-sm font-semibold text-text">Legacy files</p>
          <div className="mt-3 space-y-2">
            {legacyFiles.map((file) => (
              <div key={file.id} className="rounded-2xl border border-border bg-muted/40 px-3 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-subtle">
                    <FolderClosed className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text">{file.title}</p>
                    <div className="mt-2 flex gap-3 text-xs font-medium">
                      <a href={getFileViewerHref(file.id)} className="text-accent">
                        Open
                      </a>
                      <a href={getFileDownloadHref(file.id)} target="_blank" rel="noreferrer" className="text-accent">
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
