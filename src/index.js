import postTemplate from "./templates/post.hbs";
const formOfPosts = document.querySelector("#create-post-form");
const titleInput = document.querySelector("#title-input");
const createButton = document.querySelector("#create-button");
const contentInput = document.querySelector("#content-input");
const loadMoreBtn = document.querySelector("#load-more-btn");
const container = document.getElementById("posts-container");
const search = document.querySelector("#search-input");

let editingPostId = null;

let totalPostsCount = 0;


const postsPerPage = 3;
let currentPage = 1;

search.addEventListener("input", async () => {
  const query = search.value.trim().toLowerCase();
  container.innerHTML = "";
  const loadAllPost = await getPosts(1, 1000);
  const filteredPosts = loadAllPost.filter((post) =>
    post.title.toLowerCase().includes(query)
  );
  renderPosts(filteredPosts);
});

async function getPosts(currentPage, postsPerPage) {
  try {
    const fetching = await fetch(
      `https://687cb03f918b6422432f16f9.mockapi.io/posts?page=${currentPage}&limit=${postsPerPage}`
    );
    const response = await fetching.json();
    return response;
  } catch (error) {
    console.log("Не вдалось завантажити пости:", error);
  }
}

function renderPosts(posts) {
  posts.forEach((post) => {
    const html = postTemplate(post);

    container.insertAdjacentHTML("beforeend", html);
  });
}

loadMoreBtn.addEventListener("click", async () => {
  currentPage++;
  const newPosts = await getPosts(currentPage, postsPerPage);
  renderPosts(newPosts);
  checkLoadMoreVisibility();
});

function checkLoadMoreVisibility() {
const shownPosts = currentPage * postsPerPage;
if (shownPosts >= totalPostsCount) {
  loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = `Пости закінчились, всього було ${totalPostsCount} пости`;
    loadMoreBtn.style.backgroundColor = "#D8BFD8"
} else {
  loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = `Завантажити ще`;
    loadMoreBtn.style.backgroundColor = "#6200ea"
}
}


formOfPosts.addEventListener("submit", async (event) => {
  event.preventDefault();

  const inputTitle = titleInput.value.trim();
  const inputContent = contentInput.value.trim();

  if (editingPostId) {
    await updatePost(editingPostId, inputTitle, inputContent);
    editingPostId = null;
    createButton.textContent = "Створити пост";
  } else {
    await createPost(inputTitle, inputContent);
  }

  const posts = await getPosts(1, currentPage * postsPerPage);
  container.innerHTML = "";
  renderPosts(posts);

  formOfPosts.reset();
});

async function createPost(inputTitle, inputContent) {
  try {
    const option = {
      method: "POST",
      body: JSON.stringify({ title: inputTitle, content: inputContent }),
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
    };
    const fetching = await fetch(
      `https://687cb03f918b6422432f16f9.mockapi.io/posts`,
      option
    );
    const response = await fetching.json();
    return response;
  } catch (error) {
    console.log("Не вдалось створити пост через помилку:", error);
  }
}

document.addEventListener("click", async (event) => {
  if (event.target.classList.contains("delete-post-button")) {
    const postId = event.target.dataset.id;
    if (postId) {
      await deletePost(postId);
      const posts = await getPosts(1, currentPage * postsPerPage);
      container.innerHTML = "";
      renderPosts(posts);
    }
  }
});

async function deletePost(id) {
  try {
    const response = await fetch(
      `https://687cb03f918b6422432f16f9.mockapi.io/posts/${id}`,
      {
        method: "DELETE",
      }
    );

    return response;
  } catch (error) {
    console.log("Помилка при видаленні поста", error);
  }
}

async function fetchTotalPostsCount() {
  const response = await fetch(`https://687cb03f918b6422432f16f9.mockapi.io/posts`);
  const data = await response.json();
  totalPostsCount = data.length;
}


async function updatePost(id, title, content) {
  try {
    const response = await fetch(
      `https://687cb03f918b6422432f16f9.mockapi.io/posts/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content }),
      }
    );
    const updatedPost = await response.json();

    return updatedPost;
  } catch (error) {
    console.log("Не вдалось оновити пост через помилку:", error);
  }
}

document.addEventListener("submit", async (event) => {
  if (event.target.classList.contains("create-comment-form")) {
    event.preventDefault();
    const commentInput = event.target.querySelector(".comment-input");
    const commentUserInput = event.target.querySelector(".comment-user");
    const commentText = commentInput.value.trim();
    const commentUser = commentUserInput.value.trim();
    const postElement = event.target.closest(".post");
    const postId = postElement.querySelector(".delete-post-button").dataset.id;
    commentInput.value = "";
    if (postId && commentText && commentUser) {
      await createComment(postId, { username: commentUser, text: commentText });
      const posts = await getPosts(1, currentPage * postsPerPage);
      container.innerHTML = "";
      renderPosts(posts);
    }
  }
});

async function createComment(id, newComment) {
  try {
    const response = await fetch(
      `https://687cb03f918b6422432f16f9.mockapi.io/posts/${id}`
    );
    const post = await response.json();
    const updatedComments = [...(post.comments || []), newComment];
    const option = {
      method: "PUT",
      body: JSON.stringify({ ...post, comments: updatedComments }),
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
    };

    const updateResponse = await fetch(
      `https://687cb03f918b6422432f16f9.mockapi.io/posts/${id}`,
      option
    );
    return await updateResponse.json();
  } catch (error) {
    console.log("Не вдалось створити комент через помилку:", error);
  }
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("edit-post-button")) {
    const postId = event.target.dataset.id;
    editingPostId = postId;
    const title = event.target.dataset.title;
    const content = event.target.dataset.content;
    titleInput.value = title;
    contentInput.value = content;
    createButton.textContent = "Зберегти зміни";
  }
});

async function startApp() {
  currentPage = 1;
    await fetchTotalPostsCount();
  const posts = await getPosts(currentPage, postsPerPage);
  renderPosts(posts);
  checkLoadMoreVisibility();
}

startApp();