declare module './jsonView' {
  class JSONViewer {
    showJSON(json: any, maxDepth?: number, currentDepth?: number): void;

    getContainer(): HTMLElement;
  }

  export default JSONViewer;
}
