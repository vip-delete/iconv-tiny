import * as encodings from "../dist/encodings/index.mjs";
import { testEncodings } from "./common.mjs";
import * as tests from "./encodings/index.mjs";

testEncodings(tests, encodings);
