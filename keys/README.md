# Quantum-safe contact key

`ml-dsa-65.pub.pem` is my ML-DSA-65 (FIPS 204) public key.

SHA-256 fingerprint of the DER public key:

```
59d86286 7ccd2c01 648d80bc 14c386a1 d7f9eaeb e747dbbf abbca69f 7737afe5
```

`statement.txt` is signed with the matching private key. Verify it with OpenSSL 3.5 or later:

```bash
openssl pkeyutl -verify -pubin -inkey ml-dsa-65.pub.pem -rawin -in statement.txt -sigfile statement.txt.sig
openssl pkey -pubin -in ml-dsa-65.pub.pem -outform DER | openssl dgst -sha256
```

ML-DSA is a signature scheme, so this key proves a message came from me; it does not encrypt. Want to say hi in a quantum-safe way? Sign a message with your own ML-DSA key and send it with your public key on [LinkedIn](https://linkedin.com/in/RaymondBeecham).
