# /usr/bin/env bash 


curl 'https://oapi.dingtalk.com/robot/send?access_token=a04d64ab2e54f9e1d334ff812202e8ab6ebaa00523517ffd04e6ffdf0e40252b' \
   -H 'Content-Type: application/json' \
   -d '
  {
     "msgtype": "markdown",
     "markdown": {
      "title":"最新版本",
      "text":"#### mirror  \n > 9度，@1825718XXXX 西北风1级，空气良89，相对温度73%\n\n > ![screenshot](http://i01.lw.aliimg.com/media/lALPBbCc1ZhJGIvNAkzNBLA_1200_588.png)\n  > ###### 10点20分发布 [天气](http://www.thinkpage.cn/) "
     }
 }'