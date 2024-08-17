"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import useDesmos from "./desmosGraph";

export default function Tool() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [sortedArray, setSortedArray] = useState([]);
  const [asArray, setAsArray] = useState(true);
  const [withLineBreaks, setWithLineBreaks] = useState(false);
  const [numbersArray, setNumbersArray] = useState([]);
  const [editArray, setEditArray] = useState([]);

  useDesmos(numbersArray);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setSelectedImage(acceptedFiles[0]);
    },
    multiple: false,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".gif"],
    },
  });

  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          setSelectedImage(blob);
          break;
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener("paste", handlePaste);
      return () => {
        window.removeEventListener("paste", handlePaste);
      };
    }
  }, []);

  const handleImageUpload = async () => {
    if (!selectedImage) {
      alert("Please select or paste an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("apikey", process.env.NEXT_PUBLIC_OCR_API_KEY);
    formData.append("language", "eng");
    formData.append("file", selectedImage);

    try {
      const response = await axios.post(
        "https://api.ocr.space/parse/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      let text = response.data.ParsedResults[0].ParsedText;

      // Extract all numbers (including decimals) and store them in numbersArray
      const numbersArray = text.match(/\d+(\.\d+)?/g) || [];

      setNumbersArray(numbersArray.map(Number));
      setSortedArray(numbersArray.sort((a, b) => a - b));
      formatText(text, numbersArray);
    } catch (error) {
      console.error("Error uploading the image:", error);
      alert("Failed to upload the image.");
    }
  };

  const formatText = (text, numbersArray) => {
    let formattedText = text;

    if (asArray) {
      formattedText = numbersArray.join(", ");
      formattedText = `[${formattedText}]`;
    }

    if (withLineBreaks) {
      formattedText = numbersArray.join("\n");
    }

    setExtractedText(formattedText);
  };

  const calculateStandardDeviation = (numbers) => {
    const mean = numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
    const population_variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
    const sample_variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (numbers.length - 1);
    return {
      Population: Math.sqrt(population_variance),
      Sample: Math.sqrt(sample_variance)
    };
  }

  const calculateMode = (numbers) => {
    const frequencyMap = new Map();

    numbers.forEach((num) => {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    });

    const maxFrequency = Math.max(...frequencyMap.values());

    const modes = [...frequencyMap.entries()]
      .filter(([num, freq]) => freq === maxFrequency)
      .map(([num]) => num);

    return modes;
  };

  const calculateIQR = (numbers) => {
    const mid = Math.floor(numbers.length / 2);

    const q1 = calculateMedian(numbers.slice(0, mid));
    const q3 = calculateMedian(numbers.length % 2 === 0 ? numbers.slice(mid) : numbers.slice(mid + 1));

    const IQR = q3 - q1;
    const IQR_Range = [
      q1 - 1.5 * IQR,
      q3 + 1.5 * IQR
    ]

    return `${IQR} [${IQR_Range[0]} , ${IQR_Range[1]}]\nQ1: ${q1}\Q3: ${q3}`;
  }

  const calculateMedian = (numbers) => {
    const mid = Math.floor(numbers.length / 2);
    return numbers.length % 2 === 0
      ? (numbers[mid - 1] + numbers[mid]) / 2
      : numbers[mid];
  }

  return (
    <div>
      <div className="p-5 max-w-2xl mx-auto">
        <h1 className="text-center text-white text-2xl p-3">Image to Text Converter</h1>
        <div
          {...getRootProps({ className: "dropzone" })}
          className="border-2 border-dashed border-blue-500 p-10 text-center cursor-pointer rounded-lg bg-gray-100 mb-5"
        >
          <input {...getInputProps()} />
          <p className="text-gray-600">
            Drag & drop an image here, click to select one, or paste an image (Ctrl+V)
          </p>
        </div>
        <input
          type="text"
          className="w-full py-3 bg-gray-200 text-black rounded-lg cursor-pointer mt-5 text-lg"
          value={
            editArray.length > 0
              ? editArray
              : numbersArray.join(", ")
          }
          onChange={(e) => setEditArray(e.target.value)}
        />
        <button
          onClick={() => {
            setNumbersArray(editArray.split(",").map((num) => Number(num)));
            setSortedArray(editArray.split(",").map((num) => Number(num)).sort((a, b) => a - b));
            formatText(extractedText, editArray.split(",").map((num) => Number(num)));
          }}
          className="w-full py-3 bg-blue-500 text-white rounded-lg cursor-pointer mt-5 text-lg"
        > Confirm </button>
        <h3>
          {`[${editArray}]`}
        </h3>
        <h3>
          {`[${numbersArray.join(", ")}]`}
        </h3>
        {selectedImage && (
          <div className="mt-5 text-center">
            <h2 className="text-blue-500">Selected Image:</h2>
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Selected"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}
        <button
          onClick={handleImageUpload}
          className="w-full py-3 bg-blue-500 text-white rounded-lg cursor-pointer mt-5 text-lg"
        >
          Upload and Extract Numbers
        </button>
        <button
          onClick={() => {
            if (withLineBreaks) {
              setWithLineBreaks(false);
            }
            setAsArray(!asArray);
            formatText(extractedText, numbersArray);
          }}
          className={`w-full py-3 text-white rounded-lg cursor-pointer mt-3 text-lg ${asArray ? 'bg-green-500' : 'bg-blue-500'}`}
        >
          Numbers in Array {asArray ? "ON" : "OFF"}
        </button>
        <button
          onClick={() => {
            if (asArray) {
              setAsArray(false);
            }
            setWithLineBreaks(!withLineBreaks);
            formatText(extractedText, numbersArray);
          }}
          className={`w-full py-3 text-white rounded-lg cursor-pointer mt-3 text-lg ${withLineBreaks ? 'bg-green-500' : 'bg-blue-500'}`}
        >
          Line Breaks {withLineBreaks ? "ON" : "OFF"}
        </button>
        {extractedText && (
          <div className="mt-5 bg-gray-100 p-5 rounded-lg text-black">
            <h2 className="font-bold">Extracted Text:</h2>
            <pre className="whitespace-pre-wrap break-words">{extractedText}</pre>
            <h2 className="font-bold mt-5">Sorted Array:</h2>
            <pre>{`[${sortedArray.join(", ")}]`}</pre>
            <h3 className="font-bold mt-5">Mean:</h3>
            <pre>{numbersArray.reduce((a, b) => a + b, 0) / numbersArray.length}</pre>
            <h3 className="font-bold mt-5">Median:</h3>
            <pre>{calculateMedian(numbersArray)}</pre>
            <h3 className="font-bold mt-5">Mode:</h3>
            <pre>
              {
                calculateMode(numbersArray).length > 1
                  ? calculateMode(numbersArray).join(", ")
                  : calculateMode(numbersArray)[0]
              }
            </pre>
            <h3 className="font-bold mt-5">Standard Deviation:</h3>
            {Object.entries(calculateStandardDeviation(numbersArray)).map(([key, value]) => (
              <pre key={key}>{key}: {value}</pre>
            ))}
            <h3 className="font-bold mt-5">IQR:</h3>
            <pre>{calculateIQR(sortedArray)}</pre>
          </div>
        )}
      </div>
      <div className="flex justify-center w-full h-full pb-[100px]">
        <div id="desmos-calculator" style={{ width: '85%', height: '800px' }}></div>
      </div>
    </div>
  );
}
