import * as encodings from "../src/encodings/index.mjs";
import { testEncodings } from "./common.mjs";
import * as tests from "./encodings/index.mjs";

testEncodings(tests, encodings);
