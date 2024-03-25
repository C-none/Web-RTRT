fn check(pos: u32, border: u32, result: ptr<function, bool>) {
    *result = pos < border;
}