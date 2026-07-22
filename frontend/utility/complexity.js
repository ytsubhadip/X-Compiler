// Complexity estimator
function estimateComplexity(code) {

    const forCount = (code.match(/for/g) || []).length;
    const whileCount = (code.match(/while/g) || []).length;

    if (forCount >= 2) {
        return "O(n²)";
    }

    if (forCount === 1 || whileCount === 1) {
        return "O(n)";
    }

    return "O(1)";
}