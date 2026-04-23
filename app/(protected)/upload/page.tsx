import { requireAdmin } from "@/lib/auth/guards";
import { getAllFiles, getAllSubjects } from "@/lib/data";
import { Panel } from "@/components/ui/panel";
import { UploadForm } from "@/components/upload/upload-form";
import { DeleteFileButton } from "@/components/upload/delete-file-button";
import { bytesToSize, formatDate, getFileDownloadHref, getFileOpenHref } from "@/lib/utils";

export default async function UploadPage() {
  await requireAdmin();
  const [subjects, files] = await Promise.all([getAllSubjects(), getAllFiles()]);

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <Panel>
        <h2 className="font-heading text-xl font-semibold text-text">Upload academic file</h2>
        <p className="mt-2 text-sm text-subtle">Any file type is supported. Files are stored in Cloudinary and indexed in Firestore.</p>
        <UploadForm subjects={subjects} />
      </Panel>

      <Panel>
        <h2 className="font-heading text-xl font-semibold text-text">Uploaded files</h2>
        <div className="mt-5 space-y-3">
          {files.map((file) => (
            <div key={file.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-text">{file.title}</p>
                  <p className="text-sm text-subtle">{file.subjectName}</p>
                </div>
                <div className="text-xs text-subtle">
                  <p>{formatDate(file.uploadDate)}</p>
                  <p>{bytesToSize(file.fileSize)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 font-medium">
                    <a href={getFileOpenHref(file.id)} target="_blank" rel="noreferrer" className="text-accent">
                      Open
                    </a>
                    <a href={getFileDownloadHref(file.id)} className="text-accent">
                      Download
                    </a>
                    <DeleteFileButton fileId={file.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
