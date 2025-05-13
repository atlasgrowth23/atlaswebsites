declare module 'pdfkit' {
  export interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number | { top: number; left: number; bottom: number; right: number };
    bufferPages?: boolean;
    autoFirstPage?: boolean;
    compress?: boolean;
    info?: {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
      CreationDate?: Date;
      ModDate?: Date;
    };
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
      printing?: string;
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
      fillingForms?: boolean;
      contentAccessibility?: boolean;
      documentAssembly?: boolean;
    };
    pdfVersion?: string;
    font?: any;
    fontSize?: number;
    layout?: string;
    lineGap?: number;
  }

  export interface PDFDocument {
    x: number;
    y: number;
    page: {
      width: number;
      height: number;
      margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
      };
    };
    on(event: string, callback: Function): void;
    addPage(options?: any): this;
    bufferedPageRange(): { start: number; count: number };
    switchToPage(pageNumber: number): this;
    save(): this;
    restore(): this;
    scale(xFactor: number, yFactor?: number): this;
    translate(x: number, y: number): this;
    rotate(angle: number, options?: { origin?: [number, number] }): this;
    path(path: string): this;
    end(): void;
    
    // Path operations
    lineWidth(width: number): this;
    lineCap(style: string): this;
    lineJoin(style: string): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): this;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): this;
    rect(x: number, y: number, width: number, height: number): this;
    roundedRect(x: number, y: number, width: number, height: number, radius: number): this;
    ellipse(x: number, y: number, radiusX: number, radiusY?: number): this;
    circle(x: number, y: number, radius: number): this;
    polygon(points: Array<[number, number]>): this;
    fill(color?: string): this;
    stroke(color?: string): this;
    fillAndStroke(fillColor?: string, strokeColor?: string): this;
    closePath(): this;
    clip(): this;
    
    // Text operations
    fontSize(size: number): this;
    font(src: string, family?: string): this;
    text(text: string, x?: number, y?: number, options?: {
      align?: string;
      width?: number;
      height?: number;
      ellipsis?: string;
      columns?: number;
      columnGap?: number;
      indent?: number;
      paragraphGap?: number;
      lineGap?: number;
      wordSpacing?: number;
      characterSpacing?: number;
      fill?: boolean;
      stroke?: boolean;
      link?: string;
      underline?: boolean;
      strike?: boolean;
      continued?: boolean;
      oblique?: boolean;
      baseline?: string | number;
      destination?: string;
      goTo?: string;
    }): this;
    moveDown(lines?: number): this;
    moveUp(lines?: number): this;
    
    // Graphics
    fillColor(color: string, opacity?: number): this;
    strokeColor(color: string, opacity?: number): this;
    opacity(opacity: number): this;
    fillOpacity(opacity: number): this;
    strokeOpacity(opacity: number): this;
    linearGradient(x1: number, y1: number, x2: number, y2: number): any;
    radialGradient(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): any;
    
    // Images
    image(src: string | Buffer, x?: number, y?: number, options?: {
      width?: number;
      height?: number;
      scale?: number;
      fit?: [number, number];
      align?: string;
      valign?: string;
      link?: string;
      goTo?: string;
      destination?: string;
    }): this;
  }

  export default function(options?: PDFDocumentOptions): PDFDocument;
}