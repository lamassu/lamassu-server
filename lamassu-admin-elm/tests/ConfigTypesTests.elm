module ConfigTypesTests exposing (..)

import Test exposing (..)
import Expect
import AccountTypes
import Result
import FieldSetTypes exposing (..)
import ConfigTypes exposing (..)
import ConfigDecoder exposing (configGroupDecoder)
import Json.Decode exposing (decodeString)


testString : String
testString =
    """
{
  "code": "main",
  "display": "Main",
  "crypto": "global",
  "cryptoConfigs": [
    {
      "crypto": "BTC",
      "machineConfigs": [
        {
          "machine": "01",
          "fieldSet": {
            "fields": [
              {
                "code": "cash-in-commission",
                "display": "Cash In Commission",
                "secret": false,
                "required": false,
                "value": {
                  "fieldType": "percentage",
                  "value": 15
                },
                "status": {
                  "code": "idle"
                }
              }
            ]
          }
        }
      ]
    }
  ],
  "cryptos": [
    {
      "crypto": "BTC",
      "display": "Bitcoin"
    }
  ]
}
    """


testRecord : ConfigTypes.ConfigGroup
testRecord =
    { code = "main"
    , display = "Main"
    , crypto = GlobalCrypto
    , cryptoConfigs =
        [ { crypto = CryptoCode "BTC"
          , machineConfigs =
                [ { machine = MachineId "01"
                  , fieldSet =
                        { fields =
                            [ { code = "cash-in-commission"
                              , display = "Cash In Commission"
                              , secret = False
                              , required = False
                              , value = FieldPercentage 15
                              , loadedValue = FieldPercentage 15
                              , status = FieldIdle
                              }
                            ]
                        }
                  }
                ]
          }
        ]
    , cryptos =
        [ { crypto = CryptoCode "BTC"
          , display = "Bitcoin"
          }
        ]
    }


all : Test
all =
    describe "Parse InitialRecord"
        [ test "Basic record" <|
            \() ->
                let
                    parsed =
                        decodeString configGroupDecoder testString
                in
                    Expect.equal parsed (Ok testRecord)
        ]
