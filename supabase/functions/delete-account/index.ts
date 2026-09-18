import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Kullanıcının JWT'sini al
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Yetkisiz erişim.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase environment değişkenleri eksik.");

      return new Response(
        JSON.stringify({
          error: "Sunucu yapılandırma hatası.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Kullanıcının JWT'sini doğrula
    const supabaseUser = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      console.error("Kullanıcı doğrulama hatası:", userError);

      return new Response(
        JSON.stringify({
          error: "Geçersiz veya süresi dolmuş oturum.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // GERÇEK AUTH KULLANICISINI SİL
    // FK yapılandırmamız sayesinde:
    // - profiles -> silinir
    // - organization_members -> silinir
    // - project_members -> silinir
    // - organizations -> korunur, created_by NULL olur
    // - projects -> korunur, created_by NULL olur
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      // Detaylar sadece server loglarında
      console.error("Auth kullanıcı silme hatası:", {
        message: deleteError.message,
        code: deleteError.code,
        details: deleteError.details,
        hint: deleteError.hint,
        userId: user.id,
      });

      // Kullanıcıya veritabanı / Supabase iç detaylarını gösterme
      return new Response(
        JSON.stringify({
          error: "Hesap silinemedi. Lütfen tekrar deneyin.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Hesap başarıyla silindi:", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Hesap kalıcı olarak silindi.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Hesap silme hatası:", error);

    return new Response(
      JSON.stringify({
        error: "Hesap silinirken beklenmeyen bir hata oluştu.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});