
/// <reference path="../pb_data/types.d.ts" />

onRecordBeforeUpdateRequest((e) => {
    // 1. Verifica se quem está fazendo a requisição é um Admin do Painel
    const admin = e.httpContext.get("admin");
    if (admin) {
        return; // Permite (Admin Painel)
    }

    // 2. Verifica se quem está fazendo a requisição é um Admin do App (Collection users)
    const authRecord = e.httpContext.get("authRecord");
    if (authRecord && authRecord.getString("role") === "admin") {
        return; // Permite (Admin App)
    }

    // 3. Se for usuário comum, verifica se está tentando alterar campos proibidos
    const data = e.httpContext.requestInfo().data;

    // Lista de campos proibidos para usuários comuns
    if (data["role"]) {
        throw new BadRequestError("Acesso Negado: Você não pode alterar seu próprio cargo.");
    }

}, "users");
