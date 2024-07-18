var express = require('express');
var router = express.Router();

const axios = require("axios");
const fs = require("fs");


//OpenAI 참조하기
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



/* 
-GET home page. 노드 앱의 메인 웹페이지 요청과 응답 처리 라우팅 메소드
-https://localhost:3000/
*/
router.get('/', function(req, res, next) {
  //res.render('views폴더 내 특정 view파일 경로 지정', 뷰파일에 전달할 json 데이터);
  res.render('index', { title: 'sebs' });
});


/* 
-모든 사용자 대상 채팅 페이지 호출 라우팅 메소드
-호출주소: http://localhost:3000/chat
-요청 방식: GET
-응답 결과: 채팅 웹페이지 전용 view 파일(웹페이지)
*/
router.get('/chat', function(req, res, next) {//동기
  res.render('chat.ejs');
  });


  /* 
  -ChatGPT4-o 챗봇 채팅 페이지 요청과 응답처리 라우팅 메소드
  -호출주소: http://localhost:3000/gpt
  -요청 방식: GET
  -응답 결과: 채팅 웹페이지 전용 view 파일(웹페이지)
  */
  router.get('/gpt', async(req, res)=> {
    res.render('gpt');
  }); //비동기

  /* 
  -DALL.E3 기반 이미지 생성 요청 웹 페이지 요청과 응답처리 라우팅 메소드
  -호출주소: http://localhost:3000/dalle3
  -요청 방식: GET
  -응답 결과: 생성된 이미지 경로
  - dalle3 api 기반 TextToImage 생성 샘플
 */
router.get("/dalle3", async (req, res, next) => {
  let imageURL = "";
  let imageBinaryData = "";

  res.render("dalle3", { imageURL, imageBinaryData });
});

/*
  -dalle3 api 기반 TextToImage 이미지 생성 및 다운로드/저장 처리 
  -사용자가 입력한 프롬프트를 기반으로한 이미지 생성요청을 dalle3API와 통신해 결과를 받아 최종 결과를 클라이언트 응답하는 라우팅 메소드
 */
router.post("/dalle3", async (req, res, next) => {

  let imageURL = "";
  let imageBinaryData = "";

  //a white siamese cat

  try {
    var model = req.body.version;
    var prompt = req.body.prompt;
    var size = req.body.size;
    var style = "vivid"; // vivid
    var response_format = "url"; //b64_json or url

    //참고URL: https://platform.openai.com/docs/api-reference/images/createEdit
    // {
    //   model: dall-e-2, dall-e-2(default) or dall-e-3
    //   prompt: a white siamese cat, 최대길이:dall-e-2:1000자,dall-e-3:4000자
    //   n: 1,  생성할 이미지수 ,기본값:1 , dall-e-2:1-10사이,dall-e-3:1만지원
    //   size: 생성할 이미지크기,dall-e-2의 경우 256x256, 512x512 또는 1024x1024(기본값) 중 하나,dall-e-3 모델의 경우 1024x1024(기본값), 1792x1024 또는 1024x1792 중 하나.
    //   quality:생성할 이미지품질, standard(default) or hd(dall-e-3만지원-세밀하고일관성이 뛰어남)
    //   response_format: 반환형식 , url(기본값=60분간만 유효함) or b64_json(binarydata)
    //   style: 기본값:vivid(선명하고 초현실적이고 극적인 이미지를 생성) or natural (모델이 더 자연스럽고 덜 초현실적인 이미지를 생성-dall-e-3 만지원)
    //   user:
    // }

    const response = await openai.images.generate({
      model: model,
      prompt: prompt,
      n: 1,
      size: size,
      style: style,
      response_format: response_format,
    });

    const imgFileName = `sample-${Date.now()}.png`;
    const imgFilePath = `./public/images/${imgFileName}`;

    if (response_format == "url") {
      imageURL = response.data[0].url;

      axios({
        url: imageURL,
        responseType: "stream",
      })
        .then((response) => {
          response.data
            .pipe(fs.createWriteStream(imgFilePath))
            .on("finish", () => {
              console.log("Image saved successfully.");
            })
            .on("error", (err) => {
              console.error("Error saving image:", err);
            });
        })
        .catch((err) => {
          console.error("Error downloading image:", err);
        });
    } else {
      imageBinaryData = response.data[0].b64_json;
      const buffer = Buffer.from(imageBinaryData, "base64");
      fs.writeFileSync(imgFilePath, buffer);
      imageURL = `/images/${imgFileName}`;
    }

    console.log("이미지 생성 URL:", response);
  } catch (err) {
    console.log("OpenAI DALL.E3 API 호출 에러발생:", err);
  }

  res.render("dalle3", { imageURL, imageBinaryData });
});



module.exports = router;
