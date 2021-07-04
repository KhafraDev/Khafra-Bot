import ts from 'typescript';

const defaultOpts: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    allowJs: false,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    resolveJsonModule: true,
    strict: true,
    noImplicitAny: true,               
    strictNullChecks: false,              
    strictBindCallApply: true,           
    noImplicitThis: true,
    alwaysStrict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true 
}

/**
 * @see https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#a-minimal-compiler
 */
export const compile = (fileNames: string[], options: ts.CompilerOptions) => {
    options = Object.assign(defaultOpts, options);
    const program = ts.createProgram(fileNames, options);
    const emitResult = program.emit();

    const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    const diagnostics: string[] = [];

    for (const diagnostic of allDiagnostics) {
        if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            diagnostics.push(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            diagnostics.push(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        }
    }

    const exitCode = emitResult.emitSkipped ? 1 : 0;
    return [ `Exited with code "${exitCode}".`, ...diagnostics ];
}