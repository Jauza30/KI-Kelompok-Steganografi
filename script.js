function textToBin(text) {
    const binary = [];
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const charBin = charCode.toString(2).padStart(8, "0");
        binary.push(charBin);
    }
    return binary.join("");
}

function hideMessage() {
    const audioInput = document.getElementById("audioFile");
    const textInput = document.getElementById("message").value;
    const keyInput = document.getElementById("key").value;

    if (audioInput.files.length === 0 || textInput.trim() === "" || keyInput.trim() === "") {
        alert("Silakan pilih file audio, masukkan pesan, dan masukkan password.");
        return;
    }

    const audioFile = audioInput.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        const audioData = new Uint8Array(arrayBuffer);

        const messageBin = textToBin(textInput);
        const messageLength = messageBin.length;

        if (messageLength + 32 > audioData.length) {
            alert("Pesan terlalu panjang untuk disembunyikan dalam audio ini.");
            return;
        }

        hideMessageInAudio(audioData, messageBin, keyInput);

        const blob = new Blob([audioData], { type: "audio/wav" });
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = "steg_audio.wav";
        downloadLink.textContent = "Unduh Audio dengan Pesan Tersembunyi";

        // Menambahkan link unduh ke dalam container dan menempatkannya di tengah
        const container = document.getElementById("downloadContainer");
        container.innerHTML = ""; // Membersihkan container sebelum menambahkan link baru
        container.appendChild(downloadLink);
    };

    reader.readAsArrayBuffer(audioFile);
}

function extractMessage() {
    const audioInput = document.getElementById("audioFile");
    const keyInput = document.getElementById("key").value;

    if (audioInput.files.length === 0 || keyInput.trim() === "") {
        alert("Silakan pilih file audio dan masukkan password.");
        return;
    }

    const audioFile = audioInput.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        const audioData = new Uint8Array(arrayBuffer);

        const extractedBin = extractMessageFromAudio(audioData, keyInput);
        const extractedText = binToText(extractedBin);

        const resultElement = document.createElement("p");
        resultElement.textContent = "Pesan yang diekstrak: " + extractedText;
        resultElement.id = "extractedText";

        // Menambahkan hasil ekstraksi ke dalam container dan menempatkannya di tengah
        const container = document.getElementById("extractionContainer");
        container.innerHTML = ""; // Membersihkan container sebelum menambahkan hasil baru
        container.appendChild(resultElement);
    };

    reader.readAsArrayBuffer(audioFile);
}

function binToText(bin) {
    const text = [];
    for (let i = 0; i < bin.length; i += 8) {
        const byte = bin.substring(i, i + 8);
        const charCode = parseInt(byte, 2);
        text.push(String.fromCharCode(charCode));
    }
    return text.join("");
}

function hideMessageInAudio(audioData, messageBin, key) {
    const messageLength = messageBin.length;
    const maxAudioLength = audioData.length;

    for (let i = 0; i < 32; i++) {
        const bit = (messageLength >> i) & 1;
        audioData[i] = (audioData[i] & ~1) | bit;
    }

    for (let i = 0; i < messageLength; i++) {
        const byteIndex = i + 32;
        const bit = messageBin[i];
        const audioByte = audioData[byteIndex];

        if (bit === "1") {
            audioData[byteIndex] |= 1; // Set bit terendah menjadi 1
        } else {
            audioData[byteIndex] &= ~1; // Set bit terendah menjadi 0
        }
    }
}

function extractMessageFromAudio(audioData, key) {
    let messageLength = 0;

    for (let i = 0; i < 32; i++) {
        const bit = audioData[i] & 1;
        messageLength |= bit << i;
    }

    let extractedBin = "";
    for (let i = 32; i < messageLength + 32; i++) {
        const audioByte = audioData[i];
        const bit = audioByte & 1;
        extractedBin += bit;
    }

    return extractedBin;
}

function resetApp() {
    document.getElementById("audioFile").value = "";
    document.getElementById("message").value = "";
    document.getElementById("key").value = "";
    const extractedTextElement = document.getElementById("extractedText");
    if (extractedTextElement) {
        extractedTextElement.remove();
    }

    const downloadLink = document.querySelector("a[href^='blob']");
    if (downloadLink) {
        downloadLink.remove();
    }

    // Menghapus isi dari kedua container
    document.getElementById("downloadContainer").innerHTML = "";
    document.getElementById("extractionContainer").innerHTML = "";
}
