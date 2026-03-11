// Gestion de la page Admin et des interactions Supabase
document.addEventListener("DOMContentLoaded", async () => {
  const loginSection = document.getElementById("login-section");
  const dashboardSection = document.getElementById("dashboard-section");

  // Elements de connexion
  const loginForm = document.getElementById("login-form");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginStatus = document.getElementById("login-status");

  // Elements du dashboard
  const logoutBtn = document.getElementById("logout-btn");
  const uploadForm = document.getElementById("upload-form");
  const clientNameInput = document.getElementById("client-name");
  const clientImageInput = document.getElementById("client-image");
  const submitClientBtn = document.getElementById("submit-client-btn");
  const uploadStatus = document.getElementById("upload-status");

  // 1. Vérifier si l'utilisateur est déjà connecté au chargement
  async function checkSession() {
    try {
      const {
        data: { session },
        error,
      } = await window.supabaseClient.auth.getSession();
      if (session) {
        showDashboard();
      } else {
        showLogin();
      }
    } catch (e) {
      console.error("Session check error:", e);
      showLogin();
    }
  }

  function showDashboard() {
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
  }

  function showLogin() {
    dashboardSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
    loginForm.reset();
    loginStatus.textContent = "";
  }

  // Lancer la vérification initiale
  checkSession();

  // 2. Gestion de la connexion
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginStatus.textContent = "Connexion en cours...";
    loginStatus.className = "status-msg";

    try {
      const { data, error } =
        await window.supabaseClient.auth.signInWithPassword({
          email: loginEmail.value,
          password: loginPassword.value,
        });

      if (error) {
        console.error("Login error:", error);
        loginStatus.textContent = "Erreur: " + error.message;
        loginStatus.className = "status-msg error";
      } else {
        loginStatus.textContent = "Succès ! Redirection...";
        loginStatus.className = "status-msg success";
        setTimeout(showDashboard, 1000);
      }
    } catch (err) {
      console.error("Exception login:", err);
      loginStatus.textContent = "Erreur inattendue: " + err.message;
      loginStatus.className = "status-msg error";
    }
  });

  // 3. Gestion de la déconnexion
  logoutBtn.addEventListener("click", async () => {
    const { error } = await window.supabaseClient.auth.signOut();
    if (!error) {
      showLogin();
    }
  });

  // 4. Gestion de l'ajout d'un client
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const clientName = clientNameInput.value.trim();
    const imageFile = clientImageInput.files[0];

    if (!clientName || !imageFile) {
      showMessage("Veuillez remplir tous les champs.", "error");
      return;
    }

    submitClientBtn.textContent = "Téléchargement...";
    submitClientBtn.disabled = true;
    showMessage("Upload de l'image en cours...", "");

    try {
      // A) Upload de l'image dans le bucket 'clients'
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { data: uploadData, error: uploadError } =
        await window.supabaseClient.storage
          .from("clients")
          .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // B) Récupération de l'URL publique de l'image fraîchement uploadé
      const { data: publicRootUrl } = window.supabaseClient.storage
        .from("clients")
        .getPublicUrl(filePath);

      const publicUrl = publicRootUrl.publicUrl;

      // C) Insertion de la nouvelle ligne dans la table SQL 'clients'
      showMessage("Image uploadée. Enregistrement...", "");
      const { error: insertError } = await window.supabaseClient
        .from("clients")
        .insert([{ name: clientName, image_url: publicUrl }]);

      if (insertError) throw insertError;

      // Tout s'est bien passé
      showMessage(
        `Le client ${clientName} a été ajouté au portfolio avec succès !`,
        "success",
      );
      uploadForm.reset();
      loadAdminClients(); // Rafraichir la liste
    } catch (error) {
      console.error("Erreur d'ajout:", error);
      showMessage("Erreur : " + error.message, "error");
    } finally {
      submitClientBtn.textContent = "Ajouter au Portfolio";
      submitClientBtn.disabled = false;
    }
  });

  // 5. Charger et afficher la liste des clients dans l'admin
  async function loadAdminClients() {
    const listContainer = document.getElementById("admin-clients-list");
    if (!listContainer) return;

    listContainer.innerHTML = "<p style='color: #888;'>Chargement...</p>";

    try {
      const { data: clients, error } = await window.supabaseClient
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!clients || clients.length === 0) {
        listContainer.innerHTML =
          "<p style='color: #888;'>Aucun client pour le moment.</p>";
        return;
      }

      listContainer.innerHTML = "";
      clients.forEach((client) => {
        const item = document.createElement("div");
        item.className = "client-list-item";

        // On essaye d'extraire le nom du fichier pour la suppression du Storage plus tard
        // L'URL ressemble à: .../storage/v1/object/public/clients/public/1712..._...jpg
        const filePathMatch = client.image_url.match(/clients\/(public\/.*)$/);
        const storagePath = filePathMatch ? filePathMatch[1] : null;

        item.innerHTML = `
          <div class="client-item-info">
            <img src="${client.image_url}" alt="Logo" />
            <span>${client.name}</span>
          </div>
          <div class="action-btns">
            <button class="btn-primary btn-sm btn-edit" data-id="${client.id}" data-name="${client.name}" data-img="${client.image_url}" data-path="${storagePath}">Éditer</button>
            <button class="btn-primary btn-sm btn-delete" data-id="${client.id}" data-path="${storagePath}">Supprimer</button>
          </div>
        `;
        listContainer.appendChild(item);
      });

      // Events - Suppression
      document.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          if (
            !confirm(
              "Voulez-vous vraiment supprimer ce client de votre portfolio ?",
            )
          )
            return;

          const clientId = e.target.getAttribute("data-id");
          const imagePath = e.target.getAttribute("data-path");

          e.target.textContent = "...";
          e.target.disabled = true;

          try {
            // 1. Supprimer l'image du Storage (si on a bien trouvé son chemin)
            if (imagePath) {
              await window.supabaseClient.storage
                .from("clients")
                .remove([imagePath]);
            }

            // 2. Supprimer la ligne de la BDD
            const { error: delError } = await window.supabaseClient
              .from("clients")
              .delete()
              .eq("id", clientId);

            if (delError) throw delError;

            showMessage("Client supprimé avec succès.", "success");
            loadAdminClients(); // Rafraichissement
          } catch (err) {
            console.error("Erreur suppression:", err);
            showMessage("Erreur lors de la suppression.", "error");
            e.target.textContent = "Supprimer";
            e.target.disabled = false;
          }
        });
      });

      // Events - Édition
      document.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = e.target.getAttribute("data-id");
          const name = e.target.getAttribute("data-name");
          const img = e.target.getAttribute("data-img");
          const path = e.target.getAttribute("data-path");

          document.getElementById("edit-client-id").value = id;
          document.getElementById("edit-client-name").value = name;
          document.getElementById("edit-client-old-image").value = path; // Pour la suppression de l'ancienne image si remplacée

          document.getElementById("edit-modal").classList.add("active");
        });
      });
    } catch (err) {
      console.error("Erreur chargement liste admin:", err);
      listContainer.innerHTML =
        "<p style='color: red;'>Erreur lors du chargement des clients.</p>";
    }
  }

  // 6. Gestion du Modal d'édition
  const editModal = document.getElementById("edit-modal");
  const closeEditModalBtn = document.getElementById("close-edit-modal");
  const editForm = document.getElementById("edit-form");
  const editStatus = document.getElementById("edit-status");
  const submitEditBtn = document.getElementById("submit-edit-btn");

  closeEditModalBtn.addEventListener("click", () => {
    editModal.classList.remove("active");
    editForm.reset();
    editStatus.textContent = "";
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("edit-client-id").value;
    const oldPath = document.getElementById("edit-client-old-image").value;
    const newName = document.getElementById("edit-client-name").value.trim();
    const newImageFile = document.getElementById("edit-client-image").files[0];

    if (!newName) {
      editStatus.textContent = "Le nom est obligatoire.";
      editStatus.className = "status-msg error";
      return;
    }

    submitEditBtn.textContent = "Mise à jour...";
    submitEditBtn.disabled = true;
    editStatus.textContent = "Modification en cours...";
    editStatus.className = "status-msg";

    try {
      let finalImageUrl = undefined;

      // Si l'utilisateur a uploadé une nouvelle image
      if (newImageFile) {
        // Upload
        const fileExt = newImageFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await window.supabaseClient.storage
          .from("clients")
          .upload(filePath, newImageFile);

        if (uploadError) throw uploadError;

        // URL Publique
        const { data: publicRootUrl } = window.supabaseClient.storage
          .from("clients")
          .getPublicUrl(filePath);
        finalImageUrl = publicRootUrl.publicUrl;

        // Cleanup de l'ancienne image asynchrone pour ne pas ralentir
        if (oldPath && oldPath !== "null") {
          window.supabaseClient.storage
            .from("clients")
            .remove([oldPath])
            .catch((e) => console.error("Erreur nettoyage vieille image:", e));
        }
      }

      // Préparation de l'update
      const updateData = { name: newName };
      if (finalImageUrl) {
        updateData.image_url = finalImageUrl;
      }

      // Update Database
      const { error: updateError } = await window.supabaseClient
        .from("clients")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      editStatus.textContent = "Client mis à jour avec succès !";
      editStatus.className = "status-msg success";

      setTimeout(() => {
        editModal.classList.remove("active");
        editForm.reset();
        loadAdminClients(); // Rafraichissement
      }, 1500);
    } catch (err) {
      console.error("Erreur édition:", err);
      editStatus.textContent = "Erreur : " + err.message;
      editStatus.className = "status-msg error";
    } finally {
      submitEditBtn.textContent = "Mettre à jour";
      submitEditBtn.disabled = false;
    }
  });

  function showMessage(msg, type) {
    uploadStatus.textContent = msg;
    uploadStatus.className = `status-msg ${type}`;
    // Fait disparaître les messages de succès après 5s
    if (type === "success") {
      setTimeout(() => {
        if (uploadStatus.textContent === msg) uploadStatus.textContent = "";
      }, 5000);
    }
  }
});
