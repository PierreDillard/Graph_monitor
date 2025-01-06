export interface GPACTypes {
// Numerics
sint: number;
uint: number;
lsint: number;
flt: number;
dbl: number;
bool: string;
// Fractions
frac:string;
lfrac:string;
// Strings
str: string;
cstr: string;
"4cc": string;
//Vectors
v2di: [number, number];
v3di: [number, number, number];
v4di: [number, number, number, number];
//binaries types
mem: ArrayBuffer;
cmem: ArrayBuffer;
ptr: number;
//list types
strl: string[];
uintl: number[];
sintl: number[];
"4ccl": string[];
// Media format types
pfmt: string;
afmt: string;
cprm: string;
cftc: string;
cmxc: string;
    }
// Utils for validating GPAC  complexes types  
    export const gpacValidators = {
        isFraction: (value: string): boolean => {
          const parts = value.split('/');
          return parts.length === 2 && 
                 !isNaN(Number(parts[0])) && 
                 !isNaN(Number(parts[1])) &&
                 Number(parts[1]) !== 0;
        },
      
        isVector2D: (value: [number, number]): boolean => {
          return Array.isArray(value) && 
                 value.length === 2 && 
                 value.every(n => typeof n === 'number');
        }
      };