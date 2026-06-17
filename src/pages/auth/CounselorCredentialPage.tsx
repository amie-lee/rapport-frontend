import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'
import { TopNavBar } from '@/components/ui/TopNavBar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { springFetch } from '@/lib/springApi'

const CREDENTIAL_TYPES = ['학위', '자격증', '증명서', '기타'] as const
type CredentialType = (typeof CREDENTIAL_TYPES)[number]
const TYPE_TO_API: Record<CredentialType, 'DEGREE' | 'LICENSE' | 'CERT' | 'OTHER'> = {
  학위: 'DEGREE',
  자격증: 'LICENSE',
  증명서: 'CERT',
  기타: 'OTHER',
}

const ALLOWED_EXTENSIONS = ['pdf', 'jpeg', 'jpg', 'png']
const MAX_FILE_SIZE_MB = 10

interface CredentialEntry {
  id: number
  type: CredentialType | ''
  name: string
  file: File | null
  fileError: string | undefined
  typeOpen: boolean
}

function createEntry(id: number): CredentialEntry {
  return { id, type: '', name: '', file: null, fileError: undefined, typeOpen: false }
}

function validateFile(file: File): string | undefined {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) return 'pdf, jpeg, png 파일만 첨부할 수 있어요.'
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 해요.`
  return undefined
}

function isEntryValid(e: CredentialEntry) {
  return e.type !== '' && e.name.trim().length > 0 && e.file !== null && !e.fileError
}

async function readErrorMessage(res: Response): Promise<string> {
  const fallback = `업로드 실패 (${res.status})`
  try {
    const payload = await res.json()
    const message = payload?.message ?? payload?.error ?? payload?.data?.message
    return typeof message === 'string' && message.trim().length > 0 ? message : fallback
  } catch {
    return fallback
  }
}

// 자격 종류 드롭다운
function TypeSelect({
  value,
  open,
  onToggle,
  onSelect,
}: {
  value: CredentialType | ''
  open: boolean
  onToggle: () => void
  onSelect: (v: CredentialType) => void
}) {
  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={onToggle}
        className="w-full h-12 flex items-center justify-between px-[15px] bg-[#F9FAF9] border border-neutral-100 rounded-[6px] text-[12px] transition-colors focus:outline-none focus:border-primary-400"
      >
        <span className={value ? 'text-neutral-900' : 'text-[rgba(74,79,74,0.5)]'}>
          {value || '자격 종류'}
        </span>
        <ChevronDown
          size={16}
          className={cn('text-neutral-600 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul className="absolute z-10 top-[calc(100%+4px)] left-0 right-0 bg-white border border-neutral-100 rounded-[6px] shadow-md overflow-hidden">
          {CREDENTIAL_TYPES.map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => onSelect(t)}
                className={cn(
                  'w-full text-left px-[15px] py-[11px] text-[13px] transition-colors hover:bg-primary-50',
                  value === t ? 'text-primary-600 font-medium' : 'text-neutral-800',
                )}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// 파일 첨부 필드
function FileInput({
  file,
  error,
  onChange,
}: {
  file: File | null
  error: string | undefined
  onChange: (f: File | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files?.[0] ?? null)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="relative flex items-center h-12 bg-[#F9FAF9] border border-neutral-100 rounded-[6px] overflow-hidden">
        <span className={cn('flex-1 pl-[15px] text-[12px] truncate', file ? 'text-neutral-900' : 'text-[rgba(74,79,74,0.5)]')}>
          {file ? file.name : '파일 첨부'}
        </span>
        {file ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center justify-center w-8 h-8 mr-1 text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="파일 제거"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="flex items-center justify-center mr-2 px-[10px] py-[5px] bg-primary-600 hover:bg-primary-800 rounded-[8px] text-[10px] font-medium text-white transition-colors whitespace-nowrap"
          >
            파일 선택
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept=".pdf,.jpeg,.jpg,.png"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error && <span className="text-caption text-semantic-error-text">{error}</span>}
      {!error && <span className="text-caption text-neutral-400">pdf, jpeg, png / 최대 10MB</span>}
    </div>
  )
}

// 자격 증명 한 세트
function CredentialSection({
  entry,
  showDivider,
  removable,
  onRemove,
  onChange,
}: {
  entry: CredentialEntry
  showDivider: boolean
  removable: boolean
  onRemove: () => void
  onChange: (updated: Partial<CredentialEntry>) => void
}) {
  const handleFileChange = (file: File | null) => {
    onChange({ file, fileError: file ? validateFile(file) : undefined })
  }

  return (
    <>
      <div className="flex flex-col gap-[16px] px-[29px] py-[20px]">
        {removable && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 text-[12px] text-neutral-400 hover:text-semantic-error-text transition-colors"
              aria-label="이 항목 삭제"
            >
              <X size={13} />
              <span>삭제</span>
            </button>
          </div>
        )}
        <TypeSelect
          value={entry.type}
          open={entry.typeOpen}
          onToggle={() => onChange({ typeOpen: !entry.typeOpen })}
          onSelect={(t) => onChange({ type: t, typeOpen: false })}
        />

        <input
          type="text"
          placeholder="자격 이름"
          value={entry.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full h-12 px-[15px] bg-[#F9FAF9] border border-neutral-100 rounded-[6px] text-[12px] text-neutral-900 placeholder:text-[rgba(74,79,74,0.5)] focus:outline-none focus:border-primary-400 transition-colors"
        />

        <FileInput
          file={entry.file}
          error={entry.fileError}
          onChange={handleFileChange}
        />
      </div>

      {showDivider && <div className="h-[4px] bg-neutral-100 w-full" />}
    </>
  )
}

export default function CounselorCredentialPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<CredentialEntry[]>([createEntry(1)])
  const nextId = useRef(2)
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)

  const updateEntry = (id: number, patch: Partial<CredentialEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    )
  }

  const addEntry = () => {
    setEntries((prev) => [...prev, createEntry(nextId.current++)])
  }

  const isValid = entries.some(isEntryValid)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
    e.preventDefault()
    if (!isValid || submitting) return
    const validEntries = entries.filter(isEntryValid)
    setSubmitting(true)
    setSubmitError(undefined)
    try {
      for (const entry of validEntries) {
        if (!entry.file || !entry.type) continue
        const form = new FormData()
        form.append('file', entry.file)
        const res = await springFetch(`/api/v1/counselor/credentials?type=${TYPE_TO_API[entry.type]}`, {
          method: 'POST',
          body: form,
        })
        if (!res.ok) {
          const serverMessage = await readErrorMessage(res)
          throw new Error(serverMessage)
        }
      }
      navigate('/counselor-credential-complete')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '자격 증명 제출에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="flex flex-col w-full max-w-[402px] min-h-screen">
        <div className="px-[16px] pt-[8px]">
          <TopNavBar title="자격 증명" onBack={() => navigate(-1)} />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 pb-[120px]">
          <div className="flex flex-col mt-[20px]">
            {entries.map((entry, i) => (
              <CredentialSection
                key={entry.id}
                entry={entry}
                showDivider={i < entries.length - 1}
                removable={i > 0}
                onRemove={() => setEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                onChange={(patch) => updateEntry(entry.id, patch)}
              />
            ))}

            {/* 구분선 */}
            <div className="h-[4px] bg-neutral-100 w-full" />

            {/* 추가 버튼 */}
            <div className="flex justify-center py-[20px]">
              <button
                type="button"
                onClick={addEntry}
                className="flex items-center justify-center px-[16px] h-[36px] bg-white border border-neutral-200 rounded-[8px] text-[14px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
          {submitError && <p className="px-[29px] text-caption text-semantic-error-text">{submitError}</p>}
        </form>

        {/* 하단 고정 완료 버튼 */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[402px] px-[19px] pb-[34px] pt-[12px] bg-white">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!isValid || submitting}
            onClick={handleSubmit}
          >
            {submitting ? '제출 중...' : '완료'}
          </Button>
        </div>
      </div>
    </div>
  )
}
