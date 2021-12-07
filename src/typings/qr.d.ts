type Base64Data = {
  base64?: string;
  size?: string;
  page?: number;
};

type QRImageData = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

type QRCodeData = {
  data: VdsDataInput;
  sig: VdsSignatureInput;
};
