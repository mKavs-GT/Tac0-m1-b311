const admin = require('firebase-admin');

const serviceAccount = {
  type: "service_account",
  project_id: "mkavs-admin-panel",
  private_key_id: "121b96e0a0d7a6547764c47dfd601914a73d4099",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDF/4jzo08Bs4Ad\nH3RoOkw9L0E4v7zx679I48hAL+zSVOEAGlqkRy4kQL7gR0I+QHzyWLZw9SE781FV\nQgqtCHd5dfxcnYRqR9wrDmFwfPY0Mphfni0qpZFlXl6r5WPP4wMzmUb2rW1UZ56s\nMcsWmk1EiHz98e47HZiqgjEM/zberxMndU00NWvyWNyjscIpx1giHzf/F9Fv202b\n70iAsHm+XZFzrKrRGUtCKJz2Nai1JGPsPkN51KocfuWi5s6bLGvPYC0X7SVI1Dj8\n0zkJZBCPRrog9pb1bstVMtLwChGY34XdmA1VpOe1apy15tgAkQ3FJmA8X/PnJ+eQ\n36RXg1RtAgMBAAECggEAFuWL1hbw1ELIgjWovcPeHKY6DeC4biaDxp9WwTt5kMIx\nidRCXqR/nMAjAqci7TWCbXkeUfY6+2aSJYCfYO6teE2RWzl4/lxkhNMjKAG/a/5c\n2hPd58RhSb5txsWecwQu0tj7GJwqHDxmYEXa1TiPTmlVQP2o/cuYo8EuAHGEDCCx\nJv7iYrb4GfDb/XXEgSlC9/0eNDDJc5TvWTrSExyYAVAF+NsXH+opfnx5MtGcIEV+\nbMSekcpfIRrgPOSTQl1yvUOfJ9uzEYB/X6Nzj7J3RkSKnITeFs3Q4Akh3zuOOMDm\nqTFXUsEk9NXEdgFUPDru1UND880dO6VhmWRpybUKiQKBgQDy4UDyhSpr4/jBNpPI\nZX7r5ee002LZ8k+DvFLapfomEkKbmJPyuCp04aGHxw893IUrC5KqNciaWeX9CuFB\n2ft1lI/DUkj/fudgHeI42Jya0ZLcKFTeUlAXGe6w8fnGhTK3mPn/XHQcIMTTr0Gw\n2eiuCLaCkFGLWxPddawyK5pQOQKBgQDQsZ6RGQuY+aUlBFxbip0eTs8fEvsyPGY4\neeOsxx+TwxLnKozgSzg909/a8sb182EJmHVfX0qlzkSElUIVoLbqgFooJAphlkrS\n1jctdz+60876gPI6oOkgAeA+dJy/GJpBdWKhAjgTa4xdgfpkyV9M1rjNvBlRV0Ua\nZ1ZvQQk91QKBgAquQS7pED6CXfQRNFqBrB0vlQrsqNIwx7JhW7tlxSRbdTZmdUsd\nMjDFo1bXOCJeSjTkY2S8zL+M6IJCMjm1HkvDZrcOLUufBwnBBqu9StW8FZs84s6M\nDB2X9Fkvqu5B+UL9pTDHnguGnWE5ucfPLV5J38zKD+vy62K3xATIyhZxAoGAPb3e\n2LSdLsPk7N+uZ1LKCxZrxpi6AnHGGD1Pc2Vx3ShgZk27Yfw/BmOxnbgnzsoTUmBt\nkSrDDezJbqQt6fIjS5tvkOKgw6BQQLIpnuTh0OcrHAecImZKsjJ74l5jpVGlCWqu\nJE5gwrYVz/BNYRYGgNgh0pQstVjpU9dwxfdqwYUCgYEA2j3essSkoZFY/99OMBL/\nU55oaJlNoXUhG3+7kx6vEhawtOvqF6F6vM3cEFAVYJZrv77tFZVlI9dQG6Yc+EyE\nEoVQgnq2NtmCOTHJ+fhagOTIBdBzV7CsdWmXd+MAuHfjDJb05u9rFZT51djUfjOo\nh7eHtYY0x4xcaid4//bzOUc=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@mkavs-admin-panel.iam.gserviceaccount.com",
  client_id: "106009209839205813621",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40mkavs-admin-panel.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
