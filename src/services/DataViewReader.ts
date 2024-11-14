export class DataViewReader {
private dataview: DataView;
private offset: number;

constructor(dataView: DataView, offset: number =0) {
this.dataview = dataView;
this.offset = offset;
}

public getUint32(): number {
const value = this.dataview.getUint32(this.offset, true);
this.offset += 4;
return value;
}

public getUint64(): number {
const value = this.dataview.getFloat64(this.offset, true);
this.offset += 8;
return value;
}

public getStringOfLenght(stringLength : number): string {
    let string ="";
    for (let i = 0; i < stringLength; i++) {
        string += String.fromCharCode(this.dataview.getUint8(this.offset + i));
        this.offset ++;
    }
    return string;
}

public getString(): string {
    const stringLength = this.getUint32();
    return this.getStringOfLenght(stringLength);
}

public getText(): string {
    if(!this.dataview) return "";
    const stringLength = this.dataview.byteLength;
    return this.getStringOfLenght(stringLength);
}

public getCurrentOffset(): number { 
    return this.offset;
}

public setOffset(offset: number): void {
    this.offset = offset;
}

publicRemainingLength(): number {
    return this.dataview.byteLength - this.offset;
}
}