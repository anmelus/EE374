import rewire from "rewire"
const verify_format = rewire("../verify_format")
const blake_object_conversion = verify_format.__get__("blake_object_conversion")
// @ponicode
describe("blake_object_conversion", () => {
    test("0", () => {
        let result: any = blake_object_conversion(undefined)
        expect(result).toBe(1)
    })
})
