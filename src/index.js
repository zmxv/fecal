const modelTemperature = 1;
const modelTopK = 100;

const msgAIUnavailable = 'AI API not available. Please use Chrome 127.0.6512.0 or above and enable Gemini Nano.';
const msgAIDetected = 'AI API detected. Contemplating a speech...';
const msgAISessionError = 'Failed to create text generation session.';
const msgAIStreamError = 'Failed to create text generation stream.';

const promptBootstrap = 'Write a short paragragh of a filibuster speech regarding DEI.';
const promptContinuation = 'Write a short continuation paragraph of the following filibuster speech:\n';

let textContainer;
let statusContainer;
let session;
let paragraph = '';
let buffer = [];
let over = true;
let lastParagraph = '';
let promptsUsed = 0;
let charactersGenerated = 0;
let charactersShown = 0;

function print(text, generated) {
  const span = document.createElement('span');
  span.textContent = text;
  textContainer.appendChild(span);
  if (generated) {
    charactersShown += text.length;
  }
  statusContainer.textContent = `${promptsUsed} prompts, ${charactersGenerated} characters generated, ${charactersShown} characters shown`;
  window.scrollTo(0, document.body.scrollHeight);
}

async function babble() {
  over = false;
  const prompt = lastParagraph ? promptContinuation + lastParagraph : promptBootstrap;
  paragraph = lastParagraph;
  const stream = await session.promptStreaming(prompt);
  if (!stream) {
    print(msgAIStreamError);
    return;
  }
  promptsUsed++;

  let len = 0;
  lastParagraph = '';
  for await (const chunk of stream) {
    const delta = chunk.slice(len);
    charactersGenerated += delta.length;
    if (paragraph.startsWith(delta)) {
      paragraph = paragraph.slice(delta.length);
    } else {
      buffer.push(delta);
      lastParagraph += delta;
    }
    len = chunk.length;
  }
  over = true;
}

function poll() {
  if (buffer.length) {
    const chunk = buffer.shift();
    print(chunk, true);
    setTimeout(poll, 100 + 10 * chunk.length);
  } else {
    setTimeout(poll, 100);
  }
  if (over && buffer.length < 100) {
    babble();
  }
}

async function start() {
  session = await window.ai.createGenericSession({
    temperature: modelTemperature, 
    topK: modelTopK
  });
  if (!session) {
    print(msgAISessionError);
    return;
  }
  print(msgAIDetected);
  poll();
}

async function main() {
  textContainer = document.getElementsByTagName('main')[0];
  statusContainer = document.getElementsByTagName('footer')[0];
  if (window.ai && typeof window.ai.createTextSession === 'function') {
    const canCreate = await window.ai.canCreateTextSession();
    if (canCreate === 'readily') {
      start();
      return;
    }
  }
  print(msgAIUnavailable);
}

document.addEventListener('DOMContentLoaded', main);