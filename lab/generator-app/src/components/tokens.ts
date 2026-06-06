export interface SwatchItem {
    varName: string;
    label: string;
}

export const surfaceRamp: SwatchItem[] = [
    { varName: "--nc-bg", label: "--nc-bg" },
    { varName: "--nc-panel", label: "--nc-panel" },
    { varName: "--nc-panel-2", label: "--nc-panel-2" },
    { varName: "--nc-inset", label: "--nc-inset" },
    { varName: "--nc-console", label: "--nc-console" },
];

export const inkAndSeams: SwatchItem[] = [
    { varName: "--nc-ink", label: "--nc-ink" },
    { varName: "--nc-ink-2", label: "--nc-ink-2" },
    { varName: "--nc-ink-3", label: "--nc-ink-3" },
    { varName: "--nc-line", label: "--nc-line" },
    { varName: "--nc-line-ink", label: "--nc-line-ink" },
];

export const signalSemantic: SwatchItem[] = [
    { varName: "--nc-accent", label: "--nc-accent" },
    { varName: "--nc-success", label: "--nc-success" },
    { varName: "--nc-warning", label: "--nc-warning" },
    { varName: "--nc-error", label: "--nc-error" },
    { varName: "--nc-info", label: "--nc-info" },
];
