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

  // Elements Portfolio
  const portfolioForm = document.getElementById("portfolio-form");
  const portfolioTitleInput = document.getElementById("portfolio-title");
  const portfolioDescInput = document.getElementById("portfolio-description");
  const portfolioMediaTypeSelect = document.getElementById("portfolio-media-type");
  const portfolioFileInput = document.getElementById("portfolio-file");
  const portfolioExternalUrlInput = document.getElementById("portfolio-external-url");
  const portfolioMediaPreview = document.getElementById("portfolio-media-preview");
  const portfolioStatus = document.getElementById("portfolio-status");
  const submitPortfolioBtn = document.getElementById("submit-portfolio-btn");
  const cancelPortfolioBtn = document.getElementById("cancel-portfolio-btn");
  const adminPortfolioList = document.getElementById("admin-portfolio-list");
  const portfolioIdInput = document.getElementById("portfolio-id");
  const portfolioTab = document.getElementById("portfolio-tab");

  // Elements du Modal d'édition Portfolio
  const portfolioEditModal = document.getElementById("portfolio-edit-modal");
  const closePortfolioEditModalBtn = document.getElementById("close-portfolio-edit-modal");
  const portfolioEditForm = document.getElementById("portfolio-edit-form");
  const editPortfolioIdInput = document.getElementById("edit-portfolio-id");
  const editPortfolioTitleInput = document.getElementById("edit-portfolio-title");
  const editPortfolioDescInput = document.getElementById("edit-portfolio-description");
  const editPortfolioMediaTypeSelect = document.getElementById("edit-portfolio-media-type");
  const editPortfolioFileInput = document.getElementById("edit-portfolio-file");
  const editPortfolioExternalUrlInput = document.getElementById("edit-portfolio-external-url");
  const editPortfolioMediaPreview = document.getElementById("edit-portfolio-media-preview");
  const editPortfolioStatus = document.getElementById("edit-portfolio-status");
  const submitEditPortfolioBtn = document.getElementById("submit-edit-portfolio-btn");

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
    loadAdminClients();
    loadAdminPortfolio();
  }

  function showLogin() {
    dashboardSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
    loginForm.reset();
    loginStatus.textContent = "";
  }

  // Lancer la vérification initiale
  checkSession();

  // Gestion des Onglets
  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      // Désactiver tous les onglets
      document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
      
      // Activer l'onglet cliqué
      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      document.getElementById(target).classList.remove("hidden");
    });
  });

  // Gestion du sélecteur de média Portfolio
  if (portfolioMediaTypeSelect) {
    portfolioMediaTypeSelect.addEventListener("change", (e) => {
      if (e.target.value === "upload") {
        document.getElementById("portfolio-upload-group")?.classList.remove("hidden");
        document.getElementById("portfolio-external-group")?.classList.add("hidden");
      } else {
        document.getElementById("portfolio-upload-group")?.classList.add("hidden");
        document.getElementById("portfolio-external-group")?.classList.remove("hidden");
      }
      updateMediaPreview();
    });
  }

  // 2. Gestion de la connexion
  if (loginForm) {
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
  }

  // 3. Gestion de la déconnexion
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const { error } = await window.supabaseClient.auth.signOut();
      if (!error) {
        showLogin();
      }
    });
  }

  // 4. Gestion de l'ajout d'un client
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const clientName = clientNameInput.value.trim();
      const clientDescription = document.getElementById("client-description").value.trim();
      const imageFile = clientImageInput.files[0];
      const isPartner = document.getElementById("client-is-partner").checked;

      if (!clientName || !imageFile) {
        showMessage("Veuillez remplir tous les champs.", "error");
        return;
      }

      submitClientBtn.textContent = "Téléchargement...";
      submitClientBtn.disabled = true;
      showMessage("Upload de l'image en cours...", "");

      try {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { data: uploadData, error: uploadError } =
          await window.supabaseClient.storage
            .from("clients")
            .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicRootUrl } = window.supabaseClient.storage
          .from("clients")
          .getPublicUrl(filePath);

        const publicUrl = publicRootUrl.publicUrl;

        showMessage("Image uploadée. Enregistrement...", "");
        const { error: insertError } = await window.supabaseClient
          .from("clients")
          .insert([{ 
            name: clientName, 
            image_url: publicUrl, 
            is_partner: isPartner,
            description: clientDescription 
          }]);

        if (insertError) throw insertError;

        showMessage(`Le client ${clientName} a été ajouté avec succès !`, "success");
        uploadForm.reset();
        loadAdminClients();
      } catch (error) {
        console.error("Erreur d'ajout:", error);
        showMessage("Erreur : " + error.message, "error");
      } finally {
        submitClientBtn.textContent = "Ajouter aux Clients";
        submitClientBtn.disabled = false;
      }
    });
  }

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
        listContainer.innerHTML = "<p style='color: #888;'>Aucun client pour le moment.</p>";
        return;
      }

      listContainer.innerHTML = "";
      clients.forEach((client) => {
        const item = document.createElement("div");
        item.className = "client-list-item";

        const filePathMatch = client.image_url.match(/clients\/(public\/.*)$/);
        const storagePath = filePathMatch ? filePathMatch[1] : null;

        item.innerHTML = `
          <div class="client-item-info">
            <img src="${client.image_url}" alt="Logo" style="width: 50px; height: 50px; object-fit: cover; margin-right: 15px; border: 1px solid #111;" />
            <span>${client.name}</span>
          </div>
          <div class="action-btns">
            <button class="btn-primary btn-sm btn-edit" 
              data-id="${client.id}" 
              data-name="${client.name}" 
              data-img="${client.image_url}" 
              data-path="${storagePath}"
              data-partner="${client.is_partner}"
              data-description="${client.description || ""}">Éditer</button>
            <button class="btn-primary btn-sm btn-delete" data-id="${client.id}" data-path="${storagePath}">Supprimer</button>
          </div>
        `;
        listContainer.appendChild(item);
      });

      // Events Suppression Client
      listContainer.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          if (!confirm("Voulez-vous vraiment supprimer ce client ?")) return;
          const clientId = btn.getAttribute("data-id");
          const imagePath = btn.getAttribute("data-path");
          try {
            if (imagePath) await window.supabaseClient.storage.from("clients").remove([imagePath]);
            await window.supabaseClient.from("clients").delete().eq("id", clientId);
            loadAdminClients();
          } catch (err) { console.error(err); }
        });
      });

       // Events Édition Client
       listContainer.querySelectorAll(".btn-edit").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const name = btn.getAttribute("data-name");
          const description = btn.getAttribute("data-description");
          const path = btn.getAttribute("data-path");
          const isPartner = btn.getAttribute("data-partner") === "true";

          document.getElementById("edit-client-id").value = id;
          document.getElementById("edit-client-name").value = name;
          document.getElementById("edit-client-description").value = description;
          document.getElementById("edit-client-old-image").value = path;
          document.getElementById("edit-client-is-partner").checked = isPartner;
          document.getElementById("edit-modal").classList.add("active");
        });
      });

    } catch (err) { console.error(err); }
  }

  // --- LOGIQUE PORTFOLIO ---

  async function loadAdminPortfolio() {
    if (!adminPortfolioList) return;
    adminPortfolioList.innerHTML = "<p style='color: #888;'>Chargement des projets...</p>";
    try {
      const { data, error } = await window.supabaseClient
        .from("portfolio")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) {
        adminPortfolioList.innerHTML = "<p style='color: #888;'>Aucun projet dans le portfolio.</p>";
        return;
      }
      adminPortfolioList.innerHTML = "";
      data.forEach(project => {
        const item = document.createElement("div");
        item.className = "client-list-item";
        item.innerHTML = `
          <div class="client-item-info">
            <span style="color: #ffcc00; margin-right: 10px;">[${(project.media_format || "IMAGE").toUpperCase()}]</span>
            <span>${project.title || "Projet sans titre"}</span>
          </div>
          <div class="action-btns">
            <button class="btn-primary btn-sm btn-edit-portfolio" data-id="${project.id}">Éditer</button>
            <button class="btn-primary btn-sm btn-delete-portfolio" data-id="${project.id}">Supprimer</button>
          </div>
        `;
        adminPortfolioList.appendChild(item);
        
        item.querySelector(".btn-edit-portfolio").onclick = () => editPortfolioProject(project);
        item.querySelector(".btn-delete-portfolio").onclick = () => deletePortfolioProject(project);
      });
    } catch (err) { console.error(err); }
  }

  function editPortfolioProject(project) {
    if (!portfolioEditModal) return;

    editPortfolioIdInput.value = project.id;
    editPortfolioTitleInput.value = project.title || "";
    editPortfolioDescInput.value = project.description || "";
    editPortfolioMediaTypeSelect.value = project.media_type;
    
    if (project.media_type === "upload") {
      document.getElementById("edit-portfolio-upload-group")?.classList.remove("hidden");
      document.getElementById("edit-portfolio-external-group")?.classList.add("hidden");
      editPortfolioExternalUrlInput.value = "";
    } else {
      document.getElementById("edit-portfolio-upload-group")?.classList.add("hidden");
      document.getElementById("edit-portfolio-external-group")?.classList.remove("hidden");
      editPortfolioExternalUrlInput.value = project.media_url;
    }
    
    updateMediaPreview(project.media_url, project.media_format, true);
    portfolioEditModal.classList.add("active");
  }

  async function deletePortfolioProject(project) {
    if (!confirm("Supprimer ce projet du portfolio ?")) return;
    try {
      if (project.media_type === "upload") {
        const path = project.media_url.split("/").pop();
        await window.supabaseClient.storage.from("portfolio").remove([`public/${path}`]);
      }
      await window.supabaseClient.from("portfolio").delete().eq("id", project.id);
      loadAdminPortfolio();
    } catch (err) { console.error(err); }
  }

  if (cancelPortfolioBtn) {
    cancelPortfolioBtn.onclick = () => {
      portfolioForm.reset();
      portfolioIdInput.value = "";
      cancelPortfolioBtn.classList.add("hidden");
      submitPortfolioBtn.textContent = "Sauvegarder le Projet";
      portfolioMediaPreview.classList.add("hidden");
    };
  }

  if (portfolioExternalUrlInput) {
    portfolioExternalUrlInput.oninput = () => updateMediaPreview();
  }
  
  if (portfolioFileInput) {
    portfolioFileInput.onchange = () => {
      const file = portfolioFileInput.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const format = file.type.startsWith("video") ? "video" : "image";
        updateMediaPreview(url, format);
      }
    };
  }

  function updateMediaPreview(manualUrl, manualFormat, isEdit = false) {
    let url = manualUrl || "";
    let format = manualFormat || "";

    const previewDiv = isEdit ? editPortfolioMediaPreview : portfolioMediaPreview;
    const mediaTypeSelect = isEdit ? editPortfolioMediaTypeSelect : portfolioMediaTypeSelect;
    const externalUrlInput = isEdit ? editPortfolioExternalUrlInput : portfolioExternalUrlInput;

    if (!manualUrl) {
      if (mediaTypeSelect.value === "external") {
        url = externalUrlInput.value.trim();
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          const id = extractYoutubeId(url);
          url = `https://www.youtube.com/embed/${id}`;
          format = "iframe";
        } else if (url.includes("vimeo.com")) {
          const id = url.split("/").pop();
          url = `https://player.vimeo.com/video/${id}`;
          format = "iframe";
        } else {
          format = "image"; // Fallback
        }
      }
    }

    if (!url) {
      previewDiv?.classList.add("hidden");
      return;
    }

    previewDiv?.classList.remove("hidden");
    if (format === "iframe") {
      previewDiv.innerHTML = `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`;
    } else if (format === "video") {
      previewDiv.innerHTML = `<video src="${url}" muted loop autoplay controls></video>`;
    } else {
      previewDiv.innerHTML = `<img src="${url}" alt="Preview" />`;
    }
  }

  function extractYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  if (portfolioForm) {
    console.log("Portfolio Form found:", portfolioForm);
    portfolioForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      handlePortfolioSubmit(false);
    });
  }

  if (portfolioEditForm) {
    portfolioEditForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      handlePortfolioSubmit(true);
    });
  }

  async function handlePortfolioSubmit(isEdit) {
    const id = isEdit ? editPortfolioIdInput.value : portfolioIdInput.value;
    const title = isEdit ? editPortfolioTitleInput.value.trim() : portfolioTitleInput.value.trim();
    const description = isEdit ? editPortfolioDescInput.value.trim() : portfolioDescInput.value.trim();
    const mediaType = isEdit ? editPortfolioMediaTypeSelect.value : portfolioMediaTypeSelect.value;
    const fileInput = isEdit ? editPortfolioFileInput : portfolioFileInput;
    const externalUrlInput = isEdit ? editPortfolioExternalUrlInput : portfolioExternalUrlInput;
    const submitBtn = isEdit ? submitEditPortfolioBtn : submitPortfolioBtn;
    const statusDiv = isEdit ? editPortfolioStatus : portfolioStatus;
    const form = isEdit ? portfolioEditForm : portfolioForm;
    const previewDiv = isEdit ? editPortfolioMediaPreview : portfolioMediaPreview;
    const modal = isEdit ? portfolioEditModal : null;

    submitBtn.disabled = true;
    statusDiv.textContent = "Sauvegarde en cours...";
    statusDiv.className = "status-msg";

    try {
      let mediaUrl = "";
      let mediaFormat = "";

      if (mediaType === "upload") {
        const file = fileInput.files[0];
        if (file) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `public/${fileName}`;
          const { error: uploadError } = await window.supabaseClient.storage.from("portfolio").upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data } = window.supabaseClient.storage.from("portfolio").getPublicUrl(filePath);
          mediaUrl = data.publicUrl;
          mediaFormat = file.type.startsWith("video") ? "video" : "image";
        } else if (id) {
          const { data, error: fetchError } = await window.supabaseClient.from("portfolio").select("media_url, media_format").eq("id", id).single();
          if (fetchError) throw fetchError;
          mediaUrl = data.media_url;
          mediaFormat = data.media_format;
        }
      } else {
        mediaUrl = externalUrlInput.value.trim();
        if (mediaUrl.includes("youtube") || mediaUrl.includes("youtu.be") || mediaUrl.includes("vimeo")) {
          mediaFormat = "video";
        } else {
          mediaFormat = "image";
        }
      }

      if (!mediaUrl) throw new Error("Média manquant");

      const projectData = { title, description, media_type: mediaType, media_url: mediaUrl, media_format: mediaFormat };

      if (id) {
        const { error: updateError } = await window.supabaseClient.from("portfolio").update(projectData).eq("id", id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await window.supabaseClient.from("portfolio").insert([projectData]);
        if (insertError) throw insertError;
      }

      statusDiv.textContent = "Projet sauvegardé !";
      statusDiv.className = "status-msg success";
      
      if (isEdit) {
        setTimeout(() => modal.classList.remove("active"), 1000);
      } else {
        form.reset();
        previewDiv.classList.add("hidden");
      }
      
      loadAdminPortfolio();
    } catch (err) {
      console.error("Erreur portfolio submit:", err);
      statusDiv.textContent = "Erreur: " + err.message;
      statusDiv.className = "status-msg error";
    } finally {
      submitBtn.disabled = false;
    }
  }

  // Event handlers for Edit Modal switches
  if (editPortfolioMediaTypeSelect) {
    editPortfolioMediaTypeSelect.addEventListener("change", (e) => {
      if (e.target.value === "upload") {
        document.getElementById("edit-portfolio-upload-group")?.classList.remove("hidden");
        document.getElementById("edit-portfolio-external-group")?.classList.add("hidden");
      } else {
        document.getElementById("edit-portfolio-upload-group")?.classList.add("hidden");
        document.getElementById("edit-portfolio-external-group")?.classList.remove("hidden");
      }
      updateMediaPreview(undefined, undefined, true);
    });
  }

  if (editPortfolioExternalUrlInput) {
    editPortfolioExternalUrlInput.oninput = () => updateMediaPreview(undefined, undefined, true);
  }
  
  if (editPortfolioFileInput) {
    editPortfolioFileInput.onchange = () => {
      const file = editPortfolioFileInput.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const format = file.type.startsWith("video") ? "video" : "image";
        updateMediaPreview(url, format, true);
      }
    };
  }

  if (closePortfolioEditModalBtn) {
    closePortfolioEditModalBtn.addEventListener("click", () => {
      portfolioEditModal.classList.remove("active");
    });
  }

  // 6. Gestion du Modal d'édition Client
  const editModal = document.getElementById("edit-modal");
  const closeEditModalBtn = document.getElementById("close-edit-modal");
  const editForm = document.getElementById("edit-form");
  const editStatus = document.getElementById("edit-status");
  const submitEditBtn = document.getElementById("submit-edit-btn");

  if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener("click", () => {
      editModal.classList.remove("active");
      editForm.reset();
      if (editStatus) editStatus.textContent = "";
    });
  }

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-client-id").value;
      const oldPath = document.getElementById("edit-client-old-image").value;
      const newName = document.getElementById("edit-client-name").value.trim();
      const newDescription = document.getElementById("edit-client-description").value.trim();
      const newImageFile = document.getElementById("edit-client-image").files[0];
      const isPartner = document.getElementById("edit-client-is-partner").checked;

      submitEditBtn.disabled = true;
      try {
        let finalImageUrl = undefined;
        if (newImageFile) {
          const fileExt = newImageFile.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `public/${fileName}`;
          await window.supabaseClient.storage.from("clients").upload(filePath, newImageFile);
          const { data } = window.supabaseClient.storage.from("clients").getPublicUrl(filePath);
          finalImageUrl = data.publicUrl;
          if (oldPath && oldPath !== "null") window.supabaseClient.storage.from("clients").remove([oldPath]).catch(console.error);
        }

        const updateData = { name: newName, is_partner: isPartner, description: newDescription };
        if (finalImageUrl) updateData.image_url = finalImageUrl;

        await window.supabaseClient.from("clients").update(updateData).eq("id", id);
        editModal.classList.remove("active");
        loadAdminClients();
      } catch (err) { console.error(err); }
      finally { submitEditBtn.disabled = false; }
    });
  }

  function showMessage(msg, type) {
    if (uploadStatus) {
      uploadStatus.textContent = msg;
      uploadStatus.className = `status-msg ${type}`;
      if (type === "success") {
        setTimeout(() => { if (uploadStatus.textContent === msg) uploadStatus.textContent = ""; }, 5000);
      }
    }
  }
});
