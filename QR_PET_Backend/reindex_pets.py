import asyncio
from sqlalchemy import select
from app.api.v1.dependencies import get_db, get_pet_vector_repository
from app.models.pet import Pet

async def main():
    print("Obteniendo repositorio vectorial...")
    vector_repo = get_pet_vector_repository()

    # Apuntamos explícitamente a la colección limpia de 3072 dimensiones
    if hasattr(vector_repo, "collection_name"):
        vector_repo.collection_name = "pets_vectors_v2"

    # Si tu servicio expone directamente el cliente Chroma
    if hasattr(vector_repo, "chroma_client"):
        # PASO CLAVE: Borramos la colección vieja si existe para eliminar datos corruptos
        try:
            vector_repo.chroma_client.delete_collection(name="pets_vectors_v2")
            print("✔ Colección antigua 'pets_vectors_v2' eliminada para limpieza.")
        except Exception:
            pass # Si no existía en disco, continúa normalmente

        # Inicializamos la colección desde cero
        vector_repo.collection = (
            vector_repo.chroma_client.get_or_create_collection(
                name="pets_vectors_v2", embedding_function=None
            )
        )

    async for session in get_db():
        result = await session.execute(select(Pet))
        pets = result.scalars().all()

        if not pets:
            print("⚠️ No hay mascotas en la base de datos SQL.")
            return

        print(
            f"Indexando {len(pets)} mascotas en ChromaDB (colección: pets_vectors_v2)..."
        )

        for pet in pets:
            nombre = getattr(pet, "nombre", "Mascota")
            especie = getattr(pet, "especie", "animal")
            raza = getattr(pet, "raza", "mestizo") or "mestizo"
            descripcion = (
                getattr(pet, "descripcion", "")
                or getattr(pet, "notas", "")
                or "Sin detalles"
            )

            # Estructura de texto que leerá Gemini
            texto = f"Nombre: {nombre}. Especie: {especie}. Raza: {raza}. Detalles: {descripcion}"

            metadata = {
                "especie": str(especie).lower(),
                "nombre": str(nombre),
            }

            # Llama a index_pet o add_pet. Nota: Asegúrate de usar en tu VectorStoreService 
            # el task_type="RETRIEVAL_DOCUMENT" dentro de este método interno.
            if hasattr(vector_repo, "index_pet"):
                vector_repo.index_pet(
                    pet_id=str(pet.id), description=texto, metadata=metadata
                )
            elif hasattr(vector_repo, "add_pet"): # Por si tu método se llama add_pet
                vector_repo.add_pet(
                    pet_id=str(pet.id), description=texto, metadata=metadata
                )
            
            print(
                f" - Indexado con Gemini (3072 dims): {nombre} (ID: {pet.id})"
            )

        break

    # Verificación final de guardado permanente en disco
    total = (
        vector_repo.collection.count()
        if hasattr(vector_repo, "collection")
        else "N/A"
    )
    print(
        f"\n¡Re-indexación completada exitosamente! Total items en ChromaDB: {total}"
    )


if __name__ == "__main__":
    # Asegura que no haya procesos colgados antes de correr
    asyncio.run(main())
