import { cn } from "@/lib/utils"

interface ItemCheckboxProps {
  checked: boolean
  onChange: () => void
}

export function ItemCheckbox({ checked, onChange }: ItemCheckboxProps) {
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer",
        checked ? "border-blue-400 bg-blue-400" : "border-gray-400",
      )}
      onClick={onChange}
    >
      {checked && <div className="w-4 h-4 rounded-full bg-white" />}
    </div>
  )
}
