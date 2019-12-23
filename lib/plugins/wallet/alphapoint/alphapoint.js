const BN = require('../../../bn');
const { auth, alphapointApi, getProductId } = require('./common');

const NAME = 'Alphapoint';

const SUPPORTED_COINS = ['BTC'];

const getWallet = async (account, cryptoCode) => {
  const user = await auth(account);
  const positions = await alphapointApi.GetAccountPositions({
    OMSId: user.OMSId,
    AccountId: user.accountId,
  });

  const wallet = positions.find(position => position.ProductSymbol === cryptoCode);

  return wallet;
};

const checkCryptoCode = cryptoCode => {
  if (!SUPPORTED_COINS.includes(cryptoCode)) {
    return Promise.reject(new Error('Unsupported crypto: ' + cryptoCode));
  }

  return Promise.resolve();
};

const balance = async (account, cryptoCode) => {
  await checkCryptoCode(cryptoCode);

  const wallet = await getWallet(account, cryptoCode);

  return BN(wallet.Amount - wallet.Hold);
};

const getWithdrawTemplateType = async (user, cryptoCode) => {
  const payload = {
    ProductId: await getProductId(user, cryptoCode),
    OMSId: user.OMSId,
    AccountId: user.accountId,
  };
  const response = await alphapointApi.RPCPromise('GetWithdrawFormTemplateTypes', payload);

  const data = JSON.parse(response.o);

  if (data.TemplateTypes.length === 0) {
    throw new Error(`There are no providers configured for ${cryptoCode}.`);
  }

  const result = data.TemplateTypes[0].TemplateName;

  return result;
};

const sendCoins = async (account, address, cryptoAtoms, cryptoCode) => {
  const user = await auth(account);

  await checkCryptoCode(cryptoCode);

  const templateType = await getWithdrawTemplateType(user, cryptoCode);

  const payload = {
    OMSId: user.OMSId,
    AccountId: user.accountId,
    ProductId: await getProductId(user, cryptoCode),
    Amount: cryptoAtoms,
    TemplateForm: JSON.stringify({
      ExternalAddress: address,
      TemplateType: templateType,
    }),
    TemplateType: templateType,
  };
  const res = await alphapointApi.CreateWithdrawTicket(payload);

  const withdrawTicketRes = await alphapointApi.GetWithdrawTicket({
    OMSId: user.OMSId,
    AccountId: user.accountId,
    RequestCode: res.detail,
  });
  const transitionDetails = JSON.parse(withdrawTicketRes.WithdrawTransactionDetails);

  return { txid: transitionDetails.TxId, fee: BN(res.FeeAmt) };
};

const getStatus = async (account, address) => {
  const user = await auth(account);

  const tickets = await alphapointApi.GetWithdrawTickets({
    OMSId: user.OMSId,
    AccountId: user.accountId,
  });

  const transferDetails = tickets
    .filter(ticket => {
      const templateForm = JSON.parse(ticket.TemplateForm);
      return templateForm.ExternalAddress === address;
    })
    .sort((a, b) => b.CreatedTimestampTick - a.CreatedTimestampTick);

  const Status = transferDetails.length > 0 ? transferDetails[0].Status : undefined;

  if (Status === 'Confirmed') {
    return { status: 'confirmed' };
  }

  if (['Accepted', 'AutoAccepted', 'Pending', 'Pending2Fa'].includes(Status)) {
    return { status: 'authorized' };
  }

  if (Status === 'Rejected') {
    return 'rejected';
  }

  return { status: 'notSeen' };
};

const newAddress = async (account, info) => {
  const { cryptoCode } = info;
  const user = await auth(account);

  await checkCryptoCode(cryptoCode);

  const payload = {
    OMSId: user.OMSId,
    AccountId: user.AccountId,
    ProductId: await getProductId(user, cryptoCode),
    GenerateNewKey: true,
  };

  const response = await alphapointApi.RPCPromise('GetDepositInfo', payload);

  if (response.result) {
    const addresses = JSON.parse(response.DepositInfo);

    if (addresses.length === 0) {
      throw new Error('Failed generating new address');
    }
    return addresses[0];
  } else {
    throw new Error('Failed generating new address');
  }
};

const newFunding = async (account, cryptoCode) => {
  const address = await newAddress(account, cryptoCode);

  const wallet = getWallet(cryptoCode);

  const result = {
    fundingPendingBalance: BN(wallet.Hold),
    fundingConfirmedBalance: BN(wallet.Amount),
    fundingAddress: address,
  };

  return result;
};

module.exports = { NAME, balance, sendCoins, getStatus, newAddress, newFunding };
