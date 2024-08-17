'use client';

import { useRef, useEffect } from 'react';

export default function useDesmos(numbersArray) {
    const desmosRef = useRef(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            import('desmos').then((Desmos) => {
                if (!desmosRef.current) {
                    desmosRef.current = Desmos.GraphingCalculator(document.getElementById("desmos-calculator"));
                }

                if (desmosRef.current && numbersArray.length > 0) {
                    updateDesmosGraph(desmosRef.current, numbersArray);
                }
            });
        }
    }, [numbersArray]);

    const updateDesmosGraph = (calculator, numbers) => {
        calculator.setExpression({ id: 'list', latex: `L=[${numbers.join(", ")}]` });
        calculator.setExpression({ id: 'histogram-function', latex: `histogram(L,3)` });
        calculator.setExpression({ id: 'dotplot-function', latex: `dotplot(L)` });
        calculator.setExpression({ id: 'boxplot-function', latex: `boxplot(L)` });

        calculator.setMathBounds({
            left: Math.min(...numbers) - 5,
            right: Math.max(...numbers) + 5,
            bottom: 0,
            top: Math.max(numbers.length, 10)
        });

        const binAlignmentButton = document.querySelector('.dcg-toggle-option.dcg-selected-toggle');
        if (binAlignmentButton) binAlignmentButton.click();
    };

    return desmosRef;
}
