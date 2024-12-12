import { Encoding, EncodingFactory, Options } from "iconv-tiny";

/**
 * Single-byte Encoding Factory
 */
export interface SBEF extends EncodingFactory {
  create(options?: Options): Encoding;
}
