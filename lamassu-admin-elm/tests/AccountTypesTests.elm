module AccountTypesTests exposing (..)

import Test exposing (..)
import Expect
import AccountTypes
import Result
import FieldSetTypes exposing (..)
import AccountDecoder


testString : String
testString =
    """
    {
      "code": "twilio",
      "display": "Twilio",
      "fieldSet": {
            "fields": [
                {
                  "code": "accountSid",
                  "display": "Account SID",
                  "type": "string",
                  "secret": false,
                  "required": true,
                  "value": {
                    "fieldType": "string",
                    "value": "xx123"
                  },
                  "status": { "code": "idle" }
                }
            ]
        }
    }
    """


testRecord : AccountTypes.Account
testRecord =
    { code = "twilio"
    , display = "Twilio"
    , fieldSet =
        { fields =
            [ { code = "accountSid"
              , display = "Account SID"
              , secret = False
              , required = True
              , value = FieldString "xx123"
              , loadedValue = FieldString "xx123"
              , status = FieldIdle
              }
            ]
        }
    }


all : Test
all =
    describe "Parse InitialRecord"
        [ test "Basic record" <|
            \() ->
                let
                    parsed =
                        AccountDecoder.decodeAccount testString
                in
                    Expect.equal parsed (Ok testRecord)
        ]
