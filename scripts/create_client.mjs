import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");

// Lê o .env manualmente para pegar a chave
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  if (line.includes("=")) {
    const [key, ...rest] = line.split("=");
    env[key.trim()] = rest.join("=").trim();
  }
});

const url = env["VITE_SUPABASE_URL"];
const serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!url || !serviceKey) {
  console.error("VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY faltando no .env");
  process.exit(1);
}

// Cliente com poderes de admin
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const email = "jpdias.oliveira@outlook.com";
  const password = "admin123";
  const slug = env["VITE_STORE_SLUG"] || "minha-loja";

  console.log(`1. Criando usuário ${email}...`);
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Já confirma o email direto
  });

  if (userError) {
    if (userError.code === "email_exists" || userError.message.includes("already")) {
      console.log("Usuário já existe, prosseguindo...");
    } else {
      console.error("Erro ao criar usuário:", userError);
      process.exit(1);
    }
  }

  // Busca o usuário caso já existisse
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const user = usersData.users.find((u) => u.email === email);
  if (!user) {
    console.error("Usuário não encontrado após criação.");
    process.exit(1);
  }
  const userId = user.id;
  console.log(`Usuário ID: ${userId}`);

  console.log(`2. Criando loja "${slug}"...`);
  let storeId;
  const { data: existingStore } = await supabase.from("stores").select("*").eq("slug", slug).single();
  
  if (existingStore) {
    console.log("Loja já existe, prosseguindo...");
    storeId = existingStore.id;
  } else {
    const { data: newStore, error: storeError } = await supabase.from("stores").insert({
      slug,
      display_name: "Minha Loja",
      status: "active",
    }).select().single();

    if (storeError) {
      console.error("Erro ao criar loja:", storeError);
      process.exit(1);
    }
    storeId = newStore.id;
  }
  console.log(`Loja ID: ${storeId}`);

  console.log(`3. Vinculando usuário à loja como 'owner'...`);
  const { error: memberError } = await supabase.from("store_members").upsert({
    store_id: storeId,
    user_id: userId,
    role: "owner",
  }, { onConflict: "store_id,user_id" });

  if (memberError) {
    console.error("Erro ao vincular membro:", memberError);
    process.exit(1);
  }

  console.log(`4. Configurando store_settings padrão...`);
  const { error: settingsError } = await supabase.from("store_settings").upsert({
    store_id: storeId,
    primary_color: "#334155",
  }, { onConflict: "store_id" });

  if (settingsError) {
    console.error("Erro ao criar configurações da loja:", settingsError);
    process.exit(1);
  }

  console.log("===================================");
  console.log("✅ CONTA CRIADA E VINCULADA COM SUCESSO!");
  console.log(`Email: ${email}`);
  console.log(`Senha: ${password}`);
  console.log(`Loja: ${slug}`);
  console.log("===================================");
}

run().catch(console.error);
