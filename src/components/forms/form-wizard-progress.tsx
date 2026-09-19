type Props = {
  steps: readonly string[]
  currentStep: number
}

export function FormWizardProgress({ steps, currentStep }: Props) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Form progress">
      {steps.map((label, index) => (
        <div key={label} className="space-y-1">
          <div
            className={`h-1.5 rounded-full ${
              index <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
          />
          <p
            className={`text-center text-[11px] ${
              index === currentStep
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {index + 1}. {label}
          </p>
        </div>
      ))}
    </div>
  )
}
