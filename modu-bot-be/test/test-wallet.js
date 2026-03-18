const { ethers } = require('ethers');

// 테스트를 위한 임시 주소
const PRIVATE_KEY =
  '9907ea00cc9e912ce18e054016f46e9e4267b98fc2562052267a497048842cf9';
const wallet = new ethers.Wallet(PRIVATE_KEY);

console.log('=============================');
console.log('내 지갑 주소(포스트맨 회원가입/로그인용):');
console.log(wallet.address);
console.log('=============================');

// 테스트를 위한 임시 논스값
const nonce = '525691';

// 서명 생성 함수
async function makeSignature() {
  const signature = await wallet.signMessage(nonce);

  console.log('발급된 서명 (포스트맨 /verify 요청용):');
  console.log(signature);
  console.log('서명 글자수 (0x 포함):', signature.length);
  console.log('=============================');
}

makeSignature();
