
/// <reference path="../pb_data/types.d.ts" />

routerAdd("POST", "/api/pixgo/create", (c) => {
    // 1. Ler o corpo da requisição
    const data = $apis.requestInfo(c).data;

    // 2. Buscar a API Key segura do banco
    const result = $app.dao().findFirstRecord("admin_config", $dbx.hashExp({ key: "PIXGO_API_KEY" }));
    const apiKey = result.getString("value");

    if (!apiKey) {
        return c.json(500, { error: "PixGo API Key não configurada no servidor" });
    }

    // 3. Preparar payload (garantir external_id)
    if (!data.external_id) {
        data.external_id = "cerejavip_" + new Date().getTime() + "_" + $security.randomString(5);
    }

    // 4. Fazer a requisição para o PixGo
    const res = $http.send({
        url: "https://pixgo.org/api/v1/payment/create",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey
        },
        body: JSON.stringify(data),
        timeout: 15 // segundos
    });

    if (res.statusCode !== 200 && res.statusCode !== 201) {
        return c.json(res.statusCode, { error: "Erro no PixGo", details: res.raw });
    }

    // 5. Retornar resposta ao cliente
    return c.json(200, JSON.parse(res.raw));
});

routerAdd("GET", "/api/pixgo/status/:id", (c) => {
    const id = c.pathParam("id");

    const result = $app.dao().findFirstRecord("admin_config", $dbx.hashExp({ key: "PIXGO_API_KEY" }));
    const apiKey = result.getString("value");

    const res = $http.send({
        url: "https://pixgo.org/api/v1/payment/" + id + "/status",
        method: "GET",
        headers: {
            "X-API-Key": apiKey
        },
        timeout: 10
    });

    return c.json(res.statusCode, JSON.parse(res.raw));
});

routerAdd("POST", "/api/pixgo/confirm-and-apply", (c) => {
    const user = c.get("authRecord");
    if (!user) {
        return c.json(401, { error: "Unauthorized" });
    }

    const data = $apis.requestInfo(c).data;
    const paymentId = data.paymentId;
    const profileId = data.profileId;
    const planSlug = data.planSlug;

    if (!paymentId || !profileId || !planSlug) {
        return c.json(400, { error: "Missing parameters" });
    }

    // 1. Get API Key
    const config = $app.dao().findFirstRecord("admin_config", $dbx.hashExp({ key: "PIXGO_API_KEY" }));
    const apiKey = config.getString("value");

    // 2. Verify Payment Status with PixGo
    const res = $http.send({
        url: "https://pixgo.org/api/v1/payment/" + paymentId + "/status",
        method: "GET",
        headers: { "X-API-Key": apiKey },
        timeout: 10
    });

    if (res.statusCode !== 200) {
        return c.json(400, { error: "Could not verify payment status" });
    }

    const pixStatus = JSON.parse(res.raw);
    const status = pixStatus.status || pixStatus.payment?.status;

    if (status !== 'completed' && status !== 'paid') {
        return c.json(400, { error: "Payment not completed yet", current_status: status });
    }

    // 3. Verify Profile Ownership
    const profile = $app.dao().findRecordById("profiles", profileId);
    if (profile.getString("user") !== user.id) {
        return c.json(403, { error: "You do not own this profile" });
    }

    // 4. Update Profile
    profile.set("plan", planSlug);
    // Optional: Set expiration date logic here if needed

    $app.dao().saveRecord(profile);

    return c.json(200, { success: true, plan: planSlug });
});
