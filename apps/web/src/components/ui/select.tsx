import * as React from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '#/lib/utils'

type Option = {
  disabled: boolean
  label: React.ReactNode
  value: string
}

function getOptions(children: React.ReactNode): Option[] {
  const options: Option[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return

    if (child.type === 'option') {
      const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>
      options.push({
        disabled: Boolean(props.disabled),
        label: props.children,
        value: String(props.value ?? ''),
      })
      return
    }

    if (child.type === 'optgroup') {
      const props = child.props as React.OptgroupHTMLAttributes<HTMLOptGroupElement>
      options.push(...getOptions(props.children))
    }
  })

  return options
}

/**
 * Accessible application select. It intentionally preserves the native-select
 * children/onChange API so existing forms can adopt the richer popup without
 * changing their field state or validation contracts.
 */
export function Select({
  className,
  children,
  defaultValue,
  onChange,
  value,
  ...props
}: React.ComponentProps<'select'>) {
  const options = React.useMemo(() => getOptions(children), [children])
  const [uncontrolledValue, setUncontrolledValue] = React.useState(() =>
    String(defaultValue ?? options[0]?.value ?? ''),
  )
  const currentValue = value == null ? uncontrolledValue : String(value)

  function handleValueChange(nextValue: string | null) {
    const next = nextValue ?? ''
    if (value == null) setUncontrolledValue(next)

    onChange?.({
      currentTarget: { value: next },
      target: { value: next },
    } as React.ChangeEvent<HTMLSelectElement>)
  }

  return (
    <SelectPrimitive.Root
      disabled={props.disabled}
      name={props.name}
      required={props.required}
      value={currentValue}
      onValueChange={handleValueChange}
      items={options.map((option) => ({ label: option.label, value: option.value }))}
    >
      <SelectPrimitive.Trigger
        aria-invalid={props['aria-invalid']}
        aria-label={props['aria-label']}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-left text-[13px] text-[var(--color-ink)] shadow-[var(--shadow-sm)] outline-none',
          'transition-[border-color,box-shadow,background-color] duration-[var(--motion-fast)] ease-[var(--ease-out)] hover:border-[var(--color-primary)]/35 data-[popup-open]:border-[var(--color-primary)] data-[popup-open]:ring-2 data-[popup-open]:ring-[var(--color-focus)]/25',
          'focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]/25 aria-invalid:border-[var(--color-danger)] aria-invalid:ring-[var(--color-danger)]/20',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-[var(--opacity-disabled)]',
          className,
        )}
      >
        <SelectPrimitive.Value className="min-w-0 flex-1 truncate" />
        <SelectPrimitive.Icon className="flex shrink-0 text-[var(--color-muted-foreground)]">
          <ChevronsUpDown aria-hidden="true" className="size-3.5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={6} className="z-50 outline-none">
          <SelectPrimitive.Popup
            className="max-h-[min(18rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-panel)] p-1 text-[var(--color-ink)] shadow-[var(--shadow-lg)] outline-none transition-[transform,opacity] data-[ending-style]:scale-[.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[.98] data-[starting-style]:opacity-0"
          >
            {options.map((option) => (
              <SelectPrimitive.Item
                key={`${option.value}-${String(option.label)}`}
                disabled={option.disabled}
                value={option.value}
                className="relative grid min-w-[var(--anchor-width)] grid-cols-[1rem_1fr] items-center gap-2 rounded-[calc(var(--radius-md)-2px)] px-2 py-2 text-sm leading-4 outline-none select-none data-[highlighted]:bg-[var(--color-primary)] data-[highlighted]:text-white data-[selected]:font-medium data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
              >
                <SelectPrimitive.ItemIndicator className="flex items-center justify-center">
                  <Check aria-hidden="true" className="size-3.5" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText className="truncate">
                  {option.label}
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
