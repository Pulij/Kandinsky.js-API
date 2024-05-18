const axios = require('axios')
const FormData = require('form-data')

    class Text2ImageAPI {
        constructor(url, apiKey, secretKey) {
          this.URL = url;
          this.AUTH_HEADERS = {
            'X-Key': `Key ${apiKey}`,
            'X-Secret': `Secret ${secretKey}`,
          };
        }

        async getModels() {
          const response = await axios.get(`${this.URL}key/api/v1/models`, { headers: this.AUTH_HEADERS });
          return response.data[0].id;
        }

        async generate(prompt, model, images = 1, width = 1024, height = 1024) {
          const params = {
            type: "GENERATE",
            numImages: images,
            width,
            height,
            generateParams: {
              query: prompt
            }
          };

          const formData = new FormData();
          const modelIdData = { value: model, options: { contentType: null } };
          const paramsData = { value: JSON.stringify(params), options: { contentType: 'application/json' } };
          formData.append('model_id', modelIdData.value, modelIdData.options);
          formData.append('params', paramsData.value, paramsData.options);

          const response = await axios.post(`${this.URL}key/api/v1/text2image/run`, formData, {
            headers: {
              ...formData.getHeaders(),
              ...this.AUTH_HEADERS

            },
            'Content-Type': 'multipart/form-data'
          });
          const data = response.data;
          return data.uuid;
        }

        async checkGeneration(requestId, attempts = 10, delay = 10) {
          while (attempts > 0) {
            try {
              const response = await axios.get(`${this.URL}key/api/v1/text2image/status/${requestId}`, { headers: this.AUTH_HEADERS });
              const data = response.data;
              if (data.status === 'DONE') {
                return data.images;
              }
            } catch (error) {
              console.error(error);
            }
            attempts--;
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
          }
        }
      }

   (async () => {
       const api = new Text2ImageAPI('https://api-key.fusionbrain.ai/', 'ВАШ apiKey', 'ВАШ secretKey');
       const modelId = await api.getModels();
       const uuid = await api.generate("Js", modelId, 1, 1024, 1024, 1);
       const images = await api.checkGeneration(uuid);
       const base64String = images[0];
       const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
       const buffer = Buffer.from(base64Data, 'base64');

    // Запись буфера в файл
      fs.writeFile('image.jpg', buffer, 'base64', (err) => {
        if (err) throw err;
        console.log('Файл сохранен!');
    });
})();
