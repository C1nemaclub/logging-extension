declare class JSONViewer {
  showJSON(json: any, maxLvl?: number, colAt?: number): void;

  getContainer(): HTMLElement;
}

export default JSONViewer;
