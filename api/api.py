from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import openai
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Set up OpenAI API key from the .env file
openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key)

@app.route('/generate-word/api', methods=['POST'])
def generate_word():
    try:
        data = request.get_json()
        current_word = data.get('currentWord')

        if not current_word:
            return jsonify({'error': 'Current word is required'}), 400

        prompt = f'Generate a valid English word by changing or adding one letter to the word "{current_word}". Only provide the new word, nothing else. Make sure it is a valid English word, using the letters a-z only with no numbers or punctuation. Please validate that the new word has only either one additional letter, or one existing letter modified.'

        try:
            # Use the gpt4o-mini model
            completion = client.chat.completions.create(
                model="gpt-4o",  
                messages=[{"role": "user", "content": prompt}],l
                max_tokens=10,
                temperature=0.7,
            )

            #new_word = completion.choices[0].message['content'].strip()
            new_word = completion.choices[0].message.content.strip()
            return jsonify({'newWord': new_word})

        except openai.OpenAIError as api_error:
            print('OpenAI API error:', api_error)
            return jsonify({'error': 'An error occurred while generating the word. Please try again later.'}), 500

    except Exception as e:
        print('Error generating word:', e)
        return jsonify({'error': 'An unexpected error occurred.'}), 500

if __name__ == '__main__':
    PORT = int(os.getenv("PORT", 3000))
    app.run(host='0.0.0.0', port=PORT)
